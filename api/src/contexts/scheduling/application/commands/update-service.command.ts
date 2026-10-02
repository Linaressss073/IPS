import { ActorResolver, Clock, newTraceEvent } from '../../../../shared/application/index.js';
import { SERVICE_UPDATED } from '../constants/trace-event-types.js';
import { toServiceView } from '../mappings/scheduling-view.mapper.js';
import { ServiceRepository } from '../ports/scheduling.repositories.port.js';
import { SchedulingFinder } from '../services/scheduling-finder.service.js';
import { ServiceView, UpdateServiceCommand } from '../types/scheduling.types.js';

/** Renames or (de)activates a service; an inactive one takes no new agendas. */
export class UpdateService {
  constructor(
    private readonly services: ServiceRepository,
    private readonly finder: SchedulingFinder,
    private readonly actors: ActorResolver,
    private readonly clock: Clock,
  ) {}

  async execute(command: UpdateServiceCommand): Promise<ServiceView> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const service = await this.finder.service(command.teamId, command.serviceId);
    const before = toServiceView(service);
    const now = this.clock.now();
    const changed = service.update(command, now);
    if (changed.length > 0) {
      await this.services.save(service, [
        newTraceEvent({
          teamId: command.teamId,
          patientId: null,
          type: SERVICE_UPDATED,
          actor,
          occurredAt: now,
          data: { serviceId: service.id.value, changed, from: before, to: toServiceView(service) },
        }),
      ]);
    }
    return toServiceView(service);
  }
}
