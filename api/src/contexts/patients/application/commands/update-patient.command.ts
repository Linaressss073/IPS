import { ActorResolver, Clock, newTraceEvent } from '../../../../shared/application/index.js';
import { PATIENT_UPDATED } from '../constants/trace-event-types.js';
import {
  DocumentAlreadyRegisteredError,
  PatientVersionConflictError,
} from '../errors/patient.errors.js';
import { PatientInputMapper } from '../mappings/patient-input.mapper.js';
import { toPatientView } from '../mappings/patient-view.mapper.js';
import { PatientRepository } from '../ports/patient.repository.port.js';
import { PatientFinder } from '../services/patient-finder.service.js';
import { PatientView, UpdatePatientCommand } from '../types/patient.types.js';

/**
 * Updates a patient and traces exactly what changed (field, before, after).
 * Nothing is saved or traced when the input equals the current data.
 */
export class UpdatePatient {
  constructor(
    private readonly patients: PatientRepository,
    private readonly finder: PatientFinder,
    private readonly actors: ActorResolver,
    private readonly clock: Clock,
  ) {}

  async execute(command: UpdatePatientCommand): Promise<PatientView> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const patient = await this.finder.getOrFail(command);
    if (patient.version !== command.expectedVersion) {
      throw new PatientVersionConflictError(patient.id);
    }

    const changes = PatientInputMapper.toChanges(command.changes);
    if (
      changes.document &&
      !changes.document.equals(patient.document) &&
      (await this.patients.existsByDocument(command.teamId, changes.document))
    ) {
      throw new DocumentAlreadyRegisteredError(changes.document);
    }

    const now = this.clock.now();
    const applied = patient.update(changes, now);
    if (applied.length === 0) return toPatientView(patient);

    const event = newTraceEvent({
      teamId: command.teamId,
      patientId: patient.id.value,
      type: PATIENT_UPDATED,
      actor,
      occurredAt: now,
      data: { changes: applied },
    });
    await this.patients.update(patient, [event]);
    return toPatientView(patient);
  }
}
