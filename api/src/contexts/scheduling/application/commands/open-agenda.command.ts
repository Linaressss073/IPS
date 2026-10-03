import { formatTime } from '../../../../shared/domain/index.js';
import { ActorResolver, Clock, newTraceEvent } from '../../../../shared/application/index.js';
import { Agenda } from '../../domain/entities/agenda.entity.js';
import { AGENDA_OPENED } from '../constants/trace-event-types.js';
import {
  InactiveResourceError,
  NotAProfessionalError,
} from '../errors/scheduling.errors.js';
import { Professionals } from '../ports/other-contexts.port.js';
import { AgendaRepository } from '../ports/scheduling.repositories.port.js';
import { SchedulingFinder } from '../services/scheduling-finder.service.js';
import { OpenAgendaCommand } from '../types/scheduling.types.js';

/**
 * Opens a block of a professional's time for a service in a location. The
 * professional must have the "medico" role, service and location must be
 * active, and neither the professional nor the place may be double-booked.
 */
export class OpenAgenda {
  constructor(
    private readonly agendas: AgendaRepository,
    private readonly finder: SchedulingFinder,
    private readonly professionals: Professionals,
    private readonly actors: ActorResolver,
    private readonly clock: Clock,
  ) {}

  async execute(command: OpenAgendaCommand): Promise<{ id: string }> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const [service, location, professionals] = await Promise.all([
      this.finder.service(command.teamId, command.serviceId),
      this.finder.location(command.teamId, command.locationId),
      this.professionals.list(command.teamId),
    ]);
    if (!professionals.some((p) => p.userId === command.professionalId)) {
      throw new NotAProfessionalError(command.professionalId);
    }
    if (!service.active) throw new InactiveResourceError('service');
    if (!location.active) throw new InactiveResourceError('location');

    const now = this.clock.now();
    const agenda = Agenda.open({
      ...command,
      serviceId: service.id,
      locationId: location.id,
      now,
    });
    await this.agendas.assertNoOverlap(agenda);

    await this.agendas.add(agenda, [
      newTraceEvent({
        teamId: command.teamId,
        patientId: null,
        type: AGENDA_OPENED,
        actor,
        occurredAt: now,
        data: {
          agendaId: agenda.id.value,
          professionalId: agenda.professionalId,
          service: { id: service.id.value, code: service.code.value, name: service.name },
          location: { id: location.id.value, label: location.label },
          date: agenda.date,
          startTime: formatTime(agenda.startMinute),
          endTime: formatTime(agenda.endMinute),
          slotMinutes: agenda.slotMinutes,
        },
      }),
    ]);
    return { id: agenda.id.value };
  }
}
