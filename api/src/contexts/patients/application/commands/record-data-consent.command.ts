import { Actor, ActorResolver, Clock, newTraceEvent } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import { PatientId } from '../../domain/entities/patient-id.vo.js';
import { PATIENT_DATA_CONSENT_RECORDED } from '../constants/trace-event-types.js';
import { toPatientView } from '../mappings/patient-view.mapper.js';
import { PatientRepository } from '../ports/patient.repository.port.js';
import { PatientView, RecordDataConsentCommand } from '../types/patient.types.js';

/** The trace event of an authorization recorded `at` by `actor`. */
export function dataConsentEvent(input: { teamId: TeamId; patientId: string; actor: Actor; at: Date }) {
  return newTraceEvent({
    teamId: input.teamId,
    patientId: input.patientId,
    type: PATIENT_DATA_CONSENT_RECORDED,
    actor: input.actor,
    occurredAt: input.at,
    data: { grantedBy: input.actor.executedBy.value },
  });
}

/**
 * Records that the patient authorized the processing of their data (Ley 1581
 * de 2012). Idempotent: if it is already recorded, the original date and
 * author are kept and nothing new is traced.
 */
export class RecordDataConsent {
  constructor(
    private readonly patients: PatientRepository,
    private readonly actors: ActorResolver,
    private readonly clock: Clock,
  ) {}

  async execute(command: RecordDataConsentCommand): Promise<PatientView> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const patient = await this.patients.getById(command.teamId, PatientId.of(command.patientId));
    const now = this.clock.now();
    if (patient.recordDataConsent(actor.executedBy.value, now)) {
      await this.patients.update(patient, [
        dataConsentEvent({ teamId: command.teamId, patientId: patient.id.value, actor, at: now }),
      ]);
    }
    return toPatientView(patient);
  }
}
