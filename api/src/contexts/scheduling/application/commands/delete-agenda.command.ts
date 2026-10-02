import { ActorResolver, Clock, newTraceEvent } from '../../../../shared/application/index.js';
import { formatTime } from '../../domain/utils/colombia-time.js';
import { AGENDA_DELETED } from '../constants/trace-event-types.js';
import { AgendaHasAppointmentsError } from '../errors/scheduling.errors.js';
import {
  AgendaRepository,
  AppointmentRepository,
} from '../ports/scheduling.repositories.port.js';
import { SchedulingFinder } from '../services/scheduling-finder.service.js';
import { DeleteAgendaCommand } from '../types/scheduling.types.js';

/** Removes an agenda opened by mistake, only while no slot is booked. */
export class DeleteAgenda {
  constructor(
    private readonly agendas: AgendaRepository,
    private readonly appointments: AppointmentRepository,
    private readonly finder: SchedulingFinder,
    private readonly actors: ActorResolver,
    private readonly clock: Clock,
  ) {}

  async execute(command: DeleteAgendaCommand): Promise<void> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const agenda = await this.finder.agenda(command.teamId, command.agendaId);
    if ((await this.appointments.countActiveIn(command.teamId, agenda.id)) > 0) {
      throw new AgendaHasAppointmentsError();
    }
    await this.agendas.remove(agenda, [
      newTraceEvent({
        teamId: command.teamId,
        patientId: null,
        type: AGENDA_DELETED,
        actor,
        occurredAt: this.clock.now(),
        data: {
          agendaId: agenda.id.value,
          professionalId: agenda.professionalId,
          date: agenda.date,
          startTime: formatTime(agenda.startMinute),
          endTime: formatTime(agenda.endMinute),
        },
      }),
    ]);
  }
}
