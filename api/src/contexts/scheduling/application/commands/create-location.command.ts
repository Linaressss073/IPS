import { ActorResolver, Clock, newTraceEvent } from '../../../../shared/application/index.js';
import { CareLocation } from '../../domain/entities/care-location.entity.js';
import { LOCATION_CREATED } from '../constants/trace-event-types.js';
import { toLocationView } from '../mappings/scheduling-view.mapper.js';
import { LocationRepository } from '../ports/scheduling.repositories.port.js';
import { CreateLocationCommand, LocationView } from '../types/scheduling.types.js';

/** Adds a place where patients are attended ("Consultorio 502"). */
export class CreateLocation {
  constructor(
    private readonly locations: LocationRepository,
    private readonly actors: ActorResolver,
    private readonly clock: Clock,
  ) {}

  async execute(command: CreateLocationCommand): Promise<LocationView> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const now = this.clock.now();
    const location = CareLocation.create({ ...command, now });
    await this.locations.add(location, [
      newTraceEvent({
        teamId: command.teamId,
        patientId: null,
        type: LOCATION_CREATED,
        actor,
        occurredAt: now,
        data: toLocationView(location) as unknown as Record<string, unknown>,
      }),
    ]);
    return toLocationView(location);
  }
}
