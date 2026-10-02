import { ActorResolver, Clock, newTraceEvent } from '../../../../shared/application/index.js';
import { MedicalService } from '../../domain/entities/medical-service.entity.js';
import { SERVICE_CREATED } from '../constants/trace-event-types.js';
import { toServiceView } from '../mappings/scheduling-view.mapper.js';
import { ServiceRepository } from '../ports/scheduling.repositories.port.js';
import { CreateServiceCommand, ServiceView } from '../types/scheduling.types.js';

/** Adds a service with its turn prefix (unique in the IPS). */
export class CreateService {
  constructor(
    private readonly services: ServiceRepository,
    private readonly actors: ActorResolver,
    private readonly clock: Clock,
  ) {}

  async execute(command: CreateServiceCommand): Promise<ServiceView> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const now = this.clock.now();
    const service = MedicalService.create({ ...command, now });
    await this.services.add(service, [
      newTraceEvent({
        teamId: command.teamId,
        patientId: null,
        type: SERVICE_CREATED,
        actor,
        occurredAt: now,
        data: toServiceView(service) as unknown as Record<string, unknown>,
      }),
    ]);
    return toServiceView(service);
  }
}
