import { MongoClient, type AnyBulkWriteOperation } from 'mongodb';
import pg from 'pg';
import { loadDeploymentConfig } from '../config/deployment-config.js';
import {
  PATIENTS_COLLECTION,
  PatientDocument,
} from '../contexts/patients/infrastructure/persistence/patient.document.js';
import { normalizeForSearch } from '../contexts/patients/infrastructure/persistence/search-text.js';
import {
  STAFF_COLLECTION,
  StaffDocument,
} from '../contexts/staff/infrastructure/persistence/staff.document.js';
import {
  TRACE_EVENTS_COLLECTION,
  TraceEventDocument,
} from '../shared/infrastructure/persistence/mongo.js';

/**
 * One-off move of the data kept in PostgreSQL (until October 2026) to
 * MongoDB: patients, staff directory and trace events. Idempotent: run it
 * as many times as needed; documents are replaced by id.
 *
 *   SOURCE_DATABASE_URL=postgres://… ENV=prod node dist/scripts/import-from-postgres.js
 *
 * MONGO_URL comes from deployment/ (or the environment), like the API.
 * Needs `pg`, a dev dependency: run it from a full checkout, not on Render.
 */
const settings = { ...loadDeploymentConfig(), ...process.env };
const sourceUrl = settings.SOURCE_DATABASE_URL;
if (!sourceUrl || !settings.MONGO_URL) {
  throw new Error('SOURCE_DATABASE_URL and MONGO_URL are required');
}

const postgres = new pg.Client({ connectionString: sourceUrl });
const mongo = new MongoClient(settings.MONGO_URL);
await postgres.connect();
try {
  const db = mongo.db();

  // Trace events first: the companion counters are derived from them.
  const events = await postgres.query<{
    id: string;
    position: string;
    team_id: string;
    patient_id: string | null;
    type: string;
    requested_by: string;
    executed_by: string;
    occurred_at: Date;
    data: Record<string, unknown>;
  }>('select * from shared_trace_events order by position');
  await replaceAll<TraceEventDocument>(
    db.collection(TRACE_EVENTS_COLLECTION),
    events.rows.map((row) => ({
      _id: row.id,
      teamId: row.team_id,
      patientId: row.patient_id,
      type: row.type,
      requestedBy: row.requested_by,
      executedBy: row.executed_by,
      occurredAt: row.occurred_at,
      seq: Number(row.position),
      data: row.data,
    })),
  );
  console.log(`Trace events: ${events.rowCount}`);

  const companions = new Map<string, number>();
  for (const row of events.rows) {
    if (row.type === 'patient.companion_recorded' && row.patient_id) {
      companions.set(row.patient_id, (companions.get(row.patient_id) ?? 0) + 1);
    }
  }

  const patients = await postgres.query('select * from patients_patients');
  await replaceAll<PatientDocument>(
    db.collection(PATIENTS_COLLECTION),
    patients.rows.map((row) => {
      const name = {
        firstName: row.first_name,
        middleName: row.middle_name,
        firstLastName: row.first_last_name,
        secondLastName: row.second_last_name,
      };
      return {
        _id: row.id,
        teamId: row.team_id,
        document: { type: row.document_type, number: row.document_number },
        name,
        birthDate: row.birth_date,
        sex: row.sex,
        contact: { email: row.email, phone: row.phone, address: row.address },
        affiliation: { eps: row.eps, regime: row.regime },
        searchText: normalizeForSearch(
          `${row.document_number} ${Object.values(name).filter(Boolean).join(' ')}`,
        ),
        companionCount: companions.get(row.id) ?? 0,
        version: row.version,
        registeredAt: row.registered_at,
        updatedAt: row.updated_at,
      };
    }),
  );
  console.log(`Patients: ${patients.rowCount}`);

  // Databases migrated before the roles column existed have no roles yet.
  const { rowCount: hasRoles } = await postgres.query(
    `select 1 from information_schema.columns
      where table_name = 'staff_memberships' and column_name = 'roles'`,
  );
  const users = await postgres.query('select * from staff_users');
  const memberships = await postgres.query(
    `select team_id, user_id, provider_role, source_updated_at${hasRoles ? ', roles' : ''}
       from staff_memberships order by team_id`,
  );
  await replaceAll<StaffDocument>(
    db.collection(STAFF_COLLECTION),
    users.rows.map((user) => ({
      _id: user.user_id,
      displayName: user.display_name,
      emailMasked: user.email_masked,
      deleted: user.deleted_at !== null,
      deletedAt: user.deleted_at,
      teams: memberships.rows
        .filter((row) => row.user_id === user.user_id)
        .map((row) => ({
          teamId: row.team_id,
          providerRole: row.provider_role,
          roles: row.roles ?? [],
          sourceUpdatedAt: row.source_updated_at,
        })),
      sourceUpdatedAt: user.source_updated_at,
    })),
  );
  console.log(`Staff users: ${users.rowCount} (memberships: ${memberships.rowCount})`);
} finally {
  await postgres.end();
  await mongo.close();
}

async function replaceAll<T extends { _id: string }>(
  collection: import('mongodb').Collection<T>,
  documents: T[],
): Promise<void> {
  if (documents.length === 0) return;
  const operations = documents.map(
    (doc) =>
      ({
        replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true },
      }) as unknown as AnyBulkWriteOperation<T>,
  );
  await collection.bulkWrite(operations, { ordered: false });
}
