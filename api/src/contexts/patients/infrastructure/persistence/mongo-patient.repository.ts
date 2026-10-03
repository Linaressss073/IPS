import type { Collection, Db, MongoClient } from 'mongodb';
import { TraceEvent } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import {
  inTransaction,
  isDuplicateKey,
} from '../../../../shared/infrastructure/persistence/mongo.js';
import { appendTraceEvents } from '../../../../shared/infrastructure/persistence/trace-event.writer.js';
import { PATIENT_COMPANION_RECORDED } from '../../application/constants/trace-event-types.js';
import {
  DocumentAlreadyRegisteredError,
  PatientNotFoundError,
  PatientVersionConflictError,
} from '../../application/errors/patient.errors.js';
import { PatientRepository } from '../../application/ports/patient.repository.port.js';
import { IdentityDocument } from '../../domain/entities/identity-document.vo.js';
import { PatientId } from '../../domain/entities/patient-id.vo.js';
import { Patient } from '../../domain/entities/patient.entity.js';
import { PatientDocument, PATIENTS_COLLECTION } from './patient.document.js';
import { PatientMapper } from './patient.mapper.js';

/** Each write stores the patient and its trace events in one transaction. */
export class MongoPatientRepository implements PatientRepository {
  private readonly patients: Collection<PatientDocument>;

  constructor(
    private readonly client: MongoClient,
    private readonly db: Db,
  ) {
    this.patients = db.collection<PatientDocument>(PATIENTS_COLLECTION);
  }

  async getById(teamId: TeamId, id: PatientId): Promise<Patient> {
    const doc = await this.patients.findOne({ _id: id.value, teamId: teamId.value });
    if (!doc) throw new PatientNotFoundError(id);
    return PatientMapper.toDomain(doc);
  }

  async existsByDocument(
    teamId: TeamId,
    document: IdentityDocument,
  ): Promise<boolean> {
    const doc = await this.patients.findOne(
      {
        teamId: teamId.value,
        'document.type': document.type,
        'document.number': document.number,
      },
      { projection: { _id: 1 } },
    );
    return !!doc;
  }

  async add(patient: Patient, events: readonly TraceEvent[]): Promise<void> {
    // A companion given at registration is already #1.
    const companionCount = events.filter(
      (event) => event.type === PATIENT_COMPANION_RECORDED,
    ).length;
    await this.withDocumentGuard(patient, () =>
      inTransaction(this.client, async (session) => {
        await this.patients.insertOne(
          { ...PatientMapper.toPersistence(patient), companionCount },
          { session },
        );
        await appendTraceEvents(this.db, events, session);
      }),
    );
  }

  /**
   * Optimistic locking: the aggregate bumped its version in `update()`, so
   * the stored document must still hold the previous one. No match means
   * someone else saved first; the transaction (and its events) aborts.
   */
  async update(patient: Patient, events: readonly TraceEvent[]): Promise<void> {
    const { _id, teamId, ...fields } = PatientMapper.toPersistence(patient);
    await this.withDocumentGuard(patient, () =>
      inTransaction(this.client, async (session) => {
        const result = await this.patients.updateOne(
          { _id, teamId, version: patient.version - 1 },
          { $set: fields },
          { session },
        );
        if (result.matchedCount === 0) {
          throw new PatientVersionConflictError(patient.id);
        }
        await appendTraceEvents(this.db, events, session);
      }),
    );
  }

  /**
   * The counter is incremented atomically on the patient's document, so
   * concurrent calls get distinct numbers with no gaps.
   */
  async recordCompanion(
    teamId: TeamId,
    patientId: PatientId,
    toEvent: (number: number) => TraceEvent,
  ): Promise<TraceEvent> {
    return inTransaction(this.client, async (session) => {
      const patient = await this.patients.findOneAndUpdate(
        { _id: patientId.value, teamId: teamId.value },
        { $inc: { companionCount: 1 } },
        { session, returnDocument: 'after', projection: { companionCount: 1 } },
      );
      if (!patient) throw new PatientNotFoundError(patientId);
      const event = toEvent(patient.companionCount);
      await appendTraceEvents(this.db, [event], session);
      return event;
    });
  }

  /** Two concurrent writes with the same document: the unique index wins. */
  private async withDocumentGuard(
    patient: Patient,
    write: () => Promise<void>,
  ): Promise<void> {
    try {
      await write();
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw new DocumentAlreadyRegisteredError(patient.document);
      }
      throw error;
    }
  }
}
