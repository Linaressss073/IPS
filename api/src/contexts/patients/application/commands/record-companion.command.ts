import { Clock } from '../../../../shared/application/index.js';
import { Companion } from '../../domain/entities/companion.vo.js';
import { PatientId } from '../../domain/entities/patient-id.vo.js';
import { PatientNotFoundError } from '../errors/patient.errors.js';
import {
  companionRecordedEvent,
  toCompanionView,
} from '../mappings/companion.mapper.js';
import { PatientRepository } from '../ports/patient.repository.port.js';
import { ActorResolver } from '../services/actor-resolver.service.js';
import {
  CompanionView,
  RecordCompanionCommand,
} from '../types/patient.types.js';

/**
 * Adds a companion to the patient's history with the next number (#1, #2…).
 * Earlier companions are kept: each one is its own trace event.
 */
export class RecordCompanion {
  constructor(
    private readonly patients: PatientRepository,
    private readonly actors: ActorResolver,
    private readonly clock: Clock,
  ) {}

  async execute(command: RecordCompanionCommand): Promise<CompanionView> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const patientId = PatientId.of(command.patientId);
    const companion = Companion.of(command.companion);
    const now = this.clock.now();

    const event = await this.patients.recordCompanion(
      command.teamId,
      patientId,
      (number) =>
        companionRecordedEvent({
          teamId: command.teamId,
          patientId: patientId.value,
          companion,
          number,
          actor,
          occurredAt: now,
        }),
    );
    if (!event) throw new PatientNotFoundError(patientId);

    return toCompanionView({
      ...event,
      occurredAt: event.occurredAt.toISOString(),
      // Names are resolved by the read side (GET .../companions).
      requestedByName: null,
      executedByName: null,
    });
  }
}
