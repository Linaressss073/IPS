import { TraceEvent } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import { IdentityDocument } from '../../domain/entities/identity-document.vo.js';
import { PatientId } from '../../domain/entities/patient-id.vo.js';
import { Patient } from '../../domain/entities/patient.entity.js';

/**
 * Port (write side): persistence of the Patient aggregate. Every write
 * stores the patient and its trace events atomically.
 */
export interface PatientRepository {
  /** Throws PatientNotFoundError if the team has no such patient. */
  getById(teamId: TeamId, id: PatientId): Promise<Patient>;

  existsByDocument(teamId: TeamId, document: IdentityDocument): Promise<boolean>;

  /** Throws DocumentAlreadyRegisteredError if the document is taken. */
  add(patient: Patient, events: readonly TraceEvent[]): Promise<void>;

  /**
   * Saves a patient whose version was bumped by `update()`. Throws
   * PatientVersionConflictError if someone else saved it in the meantime.
   */
  update(patient: Patient, events: readonly TraceEvent[]): Promise<void>;

  /**
   * Numbers and stores the patient's next companion atomically: the number
   * is the previous companion count + 1, with no gaps or duplicates even
   * under concurrent calls. `toEvent` builds the event for that number.
   * Returns the stored event; throws PatientNotFoundError if the patient
   * does not exist in the team.
   */
  recordCompanion(
    teamId: TeamId,
    patientId: PatientId,
    toEvent: (number: number) => TraceEvent,
  ): Promise<TraceEvent>;
}
