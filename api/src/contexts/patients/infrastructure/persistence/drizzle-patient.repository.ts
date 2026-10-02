import { and, count, eq } from 'drizzle-orm';
import { TraceEvent } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import { Database } from '../../../../shared/infrastructure/persistence/database.module.js';
import { pgErrorCode, PG_UNIQUE_VIOLATION } from '../../../../shared/infrastructure/persistence/pg-errors.js';
import { appendTraceEvents } from '../../../../shared/infrastructure/persistence/trace-event.writer.js';
import { traceEvents } from '../../../../shared/infrastructure/persistence/trace-events.schema.js';
import { PATIENT_COMPANION_RECORDED } from '../../application/constants/trace-event-types.js';
import {
  DocumentAlreadyRegisteredError,
  PatientVersionConflictError,
} from '../../application/errors/patient.errors.js';
import { PatientRepository } from '../../application/ports/patient.repository.port.js';
import { IdentityDocument } from '../../domain/entities/identity-document.vo.js';
import { PatientId } from '../../domain/entities/patient-id.vo.js';
import { Patient } from '../../domain/entities/patient.entity.js';
import { PatientMapper } from './patient.mapper.js';
import { patients } from './patient.schema.js';

export class DrizzlePatientRepository implements PatientRepository {
  constructor(private readonly db: Database) {}

  async findById(teamId: TeamId, id: PatientId): Promise<Patient | null> {
    const [row] = await this.db
      .select()
      .from(patients)
      .where(and(eq(patients.teamId, teamId.value), eq(patients.id, id.value)))
      .limit(1);
    return row ? PatientMapper.toDomain(row) : null;
  }

  async existsByDocument(
    teamId: TeamId,
    document: IdentityDocument,
  ): Promise<boolean> {
    const [row] = await this.db
      .select({ id: patients.id })
      .from(patients)
      .where(
        and(
          eq(patients.teamId, teamId.value),
          eq(patients.documentType, document.type),
          eq(patients.documentNumber, document.number),
        ),
      )
      .limit(1);
    return !!row;
  }

  async add(patient: Patient, events: readonly TraceEvent[]): Promise<void> {
    await this.withDocumentGuard(patient, () =>
      this.db.transaction(async (tx) => {
        await tx.insert(patients).values(PatientMapper.toPersistence(patient));
        await appendTraceEvents(tx, events);
      }),
    );
  }

  /**
   * Optimistic locking: the aggregate bumped its version in `update()`, so
   * the stored row must still hold the previous one. Zero rows updated means
   * someone else saved first; the transaction (and its events) rolls back.
   */
  async update(patient: Patient, events: readonly TraceEvent[]): Promise<void> {
    const row = PatientMapper.toPersistence(patient);
    await this.withDocumentGuard(patient, () =>
      this.db.transaction(async (tx) => {
        const updated = await tx
          .update(patients)
          .set(row)
          .where(
            and(
              eq(patients.teamId, row.teamId),
              eq(patients.id, row.id),
              eq(patients.version, patient.version - 1),
            ),
          )
          .returning({ id: patients.id });
        if (updated.length === 0) {
          throw new PatientVersionConflictError(patient.id);
        }
        await appendTraceEvents(tx, events);
      }),
    );
  }

  /**
   * Locking the patient row serializes concurrent calls for the same
   * patient, so counting the previous companions gives a unique next number.
   */
  async recordCompanion(
    teamId: TeamId,
    patientId: PatientId,
    toEvent: (number: number) => TraceEvent,
  ): Promise<TraceEvent | null> {
    return this.db.transaction(async (tx) => {
      const [patient] = await tx
        .select({ id: patients.id })
        .from(patients)
        .where(
          and(eq(patients.teamId, teamId.value), eq(patients.id, patientId.value)),
        )
        .limit(1)
        .for('update');
      if (!patient) return null;

      const [{ previous }] = await tx
        .select({ previous: count() })
        .from(traceEvents)
        .where(
          and(
            eq(traceEvents.teamId, teamId.value),
            eq(traceEvents.patientId, patientId.value),
            eq(traceEvents.type, PATIENT_COMPANION_RECORDED),
          ),
        );

      const event = toEvent(previous + 1);
      await appendTraceEvents(tx, [event]);
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
      if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
        throw new DocumentAlreadyRegisteredError(patient.document);
      }
      throw error;
    }
  }
}
