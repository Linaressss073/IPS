import { TraceEvent } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
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
import { PatientRow } from './patient.schema.js';

/**
 * Test double for the PatientRepository port. Stores rows (not instances)
 * so each load returns a fresh aggregate, like the real database.
 */
export class InMemoryPatientRepository implements PatientRepository {
  readonly rows = new Map<string, PatientRow>();
  readonly events: TraceEvent[] = [];

  async findById(teamId: TeamId, id: PatientId): Promise<Patient | null> {
    const row = this.rows.get(id.value);
    return row?.teamId === teamId.value ? PatientMapper.toDomain(row) : null;
  }

  async existsByDocument(
    teamId: TeamId,
    document: IdentityDocument,
  ): Promise<boolean> {
    return [...this.rows.values()].some(
      (row) =>
        row.teamId === teamId.value &&
        row.documentType === document.type &&
        row.documentNumber === document.number,
    );
  }

  async add(patient: Patient, events: readonly TraceEvent[]): Promise<void> {
    if (await this.existsByDocument(patient.teamId, patient.document)) {
      throw new DocumentAlreadyRegisteredError(patient.document);
    }
    this.rows.set(patient.id.value, PatientMapper.toPersistence(patient));
    this.events.push(...events);
  }

  async recordCompanion(
    teamId: TeamId,
    patientId: PatientId,
    toEvent: (number: number) => TraceEvent,
  ): Promise<TraceEvent | null> {
    if (this.rows.get(patientId.value)?.teamId !== teamId.value) return null;
    const previous = this.events.filter(
      (e) =>
        e.patientId === patientId.value && e.type === PATIENT_COMPANION_RECORDED,
    ).length;
    const event = toEvent(previous + 1);
    this.events.push(event);
    return event;
  }

  async update(patient: Patient, events: readonly TraceEvent[]): Promise<void> {
    const stored = this.rows.get(patient.id.value);
    if (stored?.version !== patient.version - 1) {
      throw new PatientVersionConflictError(patient.id);
    }
    this.rows.set(patient.id.value, PatientMapper.toPersistence(patient));
    this.events.push(...events);
  }
}
