import { MongoClient, type AnyBulkWriteOperation } from 'mongodb';
import { loadDeploymentConfig } from '../config/deployment-config.js';
import { validateEnv } from '../config/env.js';
import { TeamId } from '../shared/domain/index.js';
import {
  TRACE_EVENTS_COLLECTION,
  TraceEventDocument,
} from '../shared/infrastructure/persistence/mongo.js';
import {
  PATIENT_COMPANION_RECORDED,
  PATIENT_REGISTERED,
  PATIENT_UPDATED,
} from '../contexts/patients/application/constants/trace-event-types.js';
import { Affiliation } from '../contexts/patients/domain/entities/affiliation.vo.js';
import { BiologicalSex } from '../contexts/patients/domain/entities/biological-sex.vo.js';
import { BirthDate } from '../contexts/patients/domain/entities/birth-date.vo.js';
import { ContactInfo } from '../contexts/patients/domain/entities/contact-info.vo.js';
import { IdentityDocument } from '../contexts/patients/domain/entities/identity-document.vo.js';
import { PatientId } from '../contexts/patients/domain/entities/patient-id.vo.js';
import { Patient } from '../contexts/patients/domain/entities/patient.entity.js';
import { PersonName } from '../contexts/patients/domain/entities/person-name.vo.js';
import {
  PATIENTS_COLLECTION,
  PatientDocument,
} from '../contexts/patients/infrastructure/persistence/patient.document.js';
import { PatientMapper } from '../contexts/patients/infrastructure/persistence/patient.mapper.js';
import { STAFF_COLLECTION } from '../contexts/staff/infrastructure/persistence/staff.document.js';

/**
 * One-off recovery after the PostgreSQL database was removed: rebuilds the
 * MongoDB collections from the copies the old relay and projection kept in
 * MongoDB itself.
 *
 * - `patient_timeline` (every trace event) -> `trace_events`.
 * - Each patient is replayed from its events: `patient.registered` holds the
 *   full data, each `patient.updated` the fields that changed.
 * - `staff` documents get the per-team date the new code expects.
 *
 * With RECOVER_FROM_DB (e.g. "test", the driver's default database the API
 * used while MONGO_URL named none), every collection of that database is
 * first copied into MONGO_DB_NAME; the old database is left as it was.
 *
 * Insert-only: nothing created by the new code is overwritten, and
 * `patient_timeline` is left untouched. Safe to run more than once.
 */
const LEGACY_TIMELINE = 'patient_timeline';

interface LegacyEvent extends Omit<TraceEventDocument, 'seq'> {
  position: number;
}

const settings = { ...loadDeploymentConfig(), ...process.env };
const env = validateEnv({ CLERK_SECRET_KEY: 'unused', ...settings });
const client = new MongoClient(env.MONGO_URL);
try {
  const db = client.db(env.MONGO_DB_NAME);
  const source = settings.RECOVER_FROM_DB;
  if (source && source !== env.MONGO_DB_NAME) {
    const from = client.db(source);
    const collections = await from.listCollections({}, { nameOnly: true }).toArray();
    for (const { name } of collections) {
      if (name.startsWith('system.')) continue;
      const documents = await from.collection(name).find().toArray();
      const inserted = await insertMissing(
        db.collection(name),
        documents as unknown as { _id: string }[],
      );
      console.log(`[recover] ${source}.${name} -> ${env.MONGO_DB_NAME}: ${documents.length} read, ${inserted} inserted`);
    }
  }
  const legacy = await db
    .collection<LegacyEvent>(LEGACY_TIMELINE)
    .find()
    .sort({ position: 1 })
    .toArray();
  console.log(`[recover] ${LEGACY_TIMELINE}: ${legacy.length} events`);

  // 1. Trace events, keeping the old insertion order as `seq`.
  const events: TraceEventDocument[] = legacy.map(({ position, ...event }) => ({
    ...event,
    seq: position,
  }));
  const insertedEvents = await insertMissing(db.collection(TRACE_EVENTS_COLLECTION), events);
  console.log(`[recover] trace_events inserted: ${insertedEvents}`);

  // 2. Patients, replayed from their events (oldest first).
  const byPatient = new Map<string, TraceEventDocument[]>();
  for (const event of events) {
    if (!event.patientId) continue;
    byPatient.set(event.patientId, [...(byPatient.get(event.patientId) ?? []), event]);
  }
  const patients: PatientDocument[] = [];
  for (const [patientId, history] of byPatient) {
    const rebuilt = replay(patientId, history);
    if (rebuilt) patients.push(rebuilt);
    else console.log(`[recover] skipped ${patientId}: no ${PATIENT_REGISTERED} event`);
  }
  const insertedPatients = await insertMissing(db.collection(PATIENTS_COLLECTION), patients);
  console.log(`[recover] patients rebuilt: ${patients.length}, inserted: ${insertedPatients}`);

  // 3. Staff: the old projection had no per-team provider date.
  const staff = await db.collection(STAFF_COLLECTION).updateMany(
    { 'teams.sourceUpdatedAt': { $exists: false }, 'teams.0': { $exists: true } },
    { $set: { 'teams.$[team].sourceUpdatedAt': new Date(0) } },
    { arrayFilters: [{ 'team.sourceUpdatedAt': { $exists: false } }] },
  );
  await db.collection(STAFF_COLLECTION).updateMany({}, { $unset: { projectedAt: '' } });
  const staffCount = await db.collection(STAFF_COLLECTION).countDocuments();
  console.log(`[recover] staff: ${staffCount} users, ${staff.modifiedCount} upgraded`);
} finally {
  await client.close();
}

function replay(patientId: string, history: TraceEventDocument[]): PatientDocument | null {
  const registered = history.find((event) => event.type === PATIENT_REGISTERED);
  if (!registered) return null;

  const data = { ...registered.data } as Record<string, unknown>;
  let version = 1;
  let updatedAt = registered.occurredAt;
  for (const event of history) {
    if (event.type !== PATIENT_UPDATED) continue;
    const changes = (event.data.changes ?? []) as { field: string; to: unknown }[];
    for (const change of changes) data[change.field] = change.to;
    version += 1;
    updatedAt = event.occurredAt;
  }

  const document = data.document as { type: string; number: string };
  const patient = Patient.restore(PatientId.of(patientId), {
    teamId: TeamId.of(registered.teamId),
    document: IdentityDocument.of(document.type, document.number),
    name: PersonName.of(data.name as Parameters<typeof PersonName.of>[0]),
    birthDate: BirthDate.of(data.birthDate as string),
    sex: BiologicalSex.of(data.sex as string),
    contact: ContactInfo.of(data.contact as Parameters<typeof ContactInfo.of>[0]),
    affiliation: Affiliation.of(data.affiliation as Parameters<typeof Affiliation.of>[0]),
    version,
    registeredAt: registered.occurredAt,
    updatedAt,
  });
  return {
    ...PatientMapper.toPersistence(patient),
    companionCount: history.filter((event) => event.type === PATIENT_COMPANION_RECORDED)
      .length,
  };
}

/** Inserts only the documents whose _id is not there yet; returns how many. */
async function insertMissing<T extends { _id: string }>(
  collection: import('mongodb').Collection,
  documents: T[],
): Promise<number> {
  if (documents.length === 0) return 0;
  const operations = documents.map(
    (doc) =>
      ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $setOnInsert: doc },
          upsert: true,
        },
      }) as unknown as AnyBulkWriteOperation,
  );
  const result = await collection.bulkWrite(operations, { ordered: false });
  return result.upsertedCount;
}
