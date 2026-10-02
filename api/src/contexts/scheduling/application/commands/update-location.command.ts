import { ActorResolver, Clock, newTraceEvent } from '../../../../shared/application/index.js';
import { LOCATION_UPDATED } from '../constants/trace-event-types.js';
import { toLocationView } from '../mappings/scheduling-view.mapper.js';
import { LocationRepository } from '../ports/scheduling.repositories.port.js';
import { SchedulingFinder } from '../services/scheduling-finder.service.js';
import { LocationView, UpdateLocationCommand } from '../types/scheduling.types.js';

/** (De)activates a location; an inactive one takes no new agendas. */
export class UpdateLocation {
  constructor(
    private readonly locations: LocationRepository,
    private readonly finder: SchedulingFinder,
    private readonly actors: ActorResolver,
    private readonly clock: Clock,
  ) {}

  async execute(command: UpdateLocationCommand): Promise<LocationView> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const location = await this.finder.location(command.teamId, command.locationId);
    const now = this.clock.now();
    if (location.setActive(command.active, now)) {
      await this.locations.save(location, [
        newTraceEvent({
          teamId: command.teamId,
          patientId: null,
          type: LOCATION_UPDATED,
          actor,
          occurredAt: now,
          data: { locationId: location.id.value, active: location.active },
        }),
      ]);
    }
    return toLocationView(location);
  }
}
