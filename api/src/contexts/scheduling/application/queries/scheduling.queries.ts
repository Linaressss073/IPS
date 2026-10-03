import { parseCalendarDate, TeamId } from '../../../../shared/domain/index.js';
import { Professionals } from '../ports/other-contexts.port.js';
import { SchedulingReadModel } from '../ports/scheduling-read-model.port.js';
import { NameResolver } from '../services/name-resolver.service.js';
import {
  AgendaView,
  DayAgendaQuery,
  LocationView,
  ProfessionalView,
  ServiceView,
} from '../types/scheduling.types.js';

/** The IPS's services (active and inactive), by name. */
export class ListServices {
  constructor(private readonly readModel: SchedulingReadModel) {}

  execute(teamId: TeamId): Promise<ServiceView[]> {
    return this.readModel.listServices(teamId);
  }
}

/** The IPS's locations (active and inactive), by label. */
export class ListLocations {
  constructor(private readonly readModel: SchedulingReadModel) {}

  execute(teamId: TeamId): Promise<LocationView[]> {
    return this.readModel.listLocations(teamId);
  }
}

/** Staff members with the "medico" role: who can have an agenda. */
export class ListProfessionals {
  constructor(private readonly professionals: Professionals) {}

  execute(teamId: TeamId): Promise<ProfessionalView[]> {
    return this.professionals.list(teamId);
  }
}

/** Every agenda of a day with its slots: free or held by an appointment. */
export class GetDayAgenda {
  constructor(
    private readonly readModel: SchedulingReadModel,
    private readonly names: NameResolver,
  ) {}

  async execute(query: DayAgendaQuery): Promise<AgendaView[]> {
    const views = await this.readModel.dayAgendas({ ...query, date: parseCalendarDate(query.date) });
    return this.names.agendas(query.teamId, views);
  }
}
