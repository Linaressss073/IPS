import { Clock, newTraceEvent } from '../../../../shared/application/index.js';
import { Companion } from '../../domain/entities/companion.vo.js';
import { Patient } from '../../domain/entities/patient.entity.js';
import { PATIENT_REGISTERED } from '../constants/trace-event-types.js';
import { DocumentAlreadyRegisteredError } from '../errors/patient.errors.js';
import { companionRecordedEvent } from '../mappings/companion.mapper.js';
import { PatientInputMapper } from '../mappings/patient-input.mapper.js';
import { toPatientView } from '../mappings/patient-view.mapper.js';
import { PatientRepository } from '../ports/patient.repository.port.js';
import { ActorResolver } from '../services/actor-resolver.service.js';
import { PatientView, RegisterPatientCommand } from '../types/patient.types.js';

/**
 * Registers a patient once per team (IPS) and traces it: the patient, the
 * "patient.registered" event and, if given, the first companion (#1) are
 * stored in the same transaction.
 */
export class RegisterPatient {
  constructor(
    private readonly patients: PatientRepository,
    private readonly actors: ActorResolver,
    private readonly clock: Clock,
  ) {}

  async execute(command: RegisterPatientCommand): Promise<PatientView> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const data = PatientInputMapper.toData(command);
    if (await this.patients.existsByDocument(command.teamId, data.document)) {
      throw new DocumentAlreadyRegisteredError(data.document);
    }

    const companion = command.companion ? Companion.of(command.companion) : null;

    const now = this.clock.now();
    const patient = Patient.register({ ...data, teamId: command.teamId, now });
    const events = [
      newTraceEvent({
        teamId: command.teamId,
        patientId: patient.id.value,
        type: PATIENT_REGISTERED,
        actor,
        occurredAt: now,
        data: patient.snapshot(),
      }),
    ];
    // A new patient has no companions yet, so this one is #1.
    if (companion) {
      events.push(
        companionRecordedEvent({
          teamId: command.teamId,
          patientId: patient.id.value,
          companion,
          number: 1,
          actor,
          occurredAt: now,
        }),
      );
    }

    await this.patients.add(patient, events);
    return toPatientView(patient);
  }
}
