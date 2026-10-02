import { Actor } from '../../../../shared/application/index.js';
import { Appointment } from '../../domain/entities/appointment.entity.js';
import { APPOINTMENT_RESCHEDULED } from '../constants/trace-event-types.js';
import { InactiveResourceError } from '../errors/scheduling.errors.js';
import { appointmentEvent, slotData } from '../mappings/appointment-event.mapper.js';
import { RescheduleAppointmentCommand } from '../types/scheduling.types.js';
import { ChangeAppointment } from './change-appointment.command.js';

/**
 * Moves the appointment to another free slot of the same service (another
 * day, time, professional or place). It goes back to "agendada".
 */
export class RescheduleAppointment extends ChangeAppointment<RescheduleAppointmentCommand> {
  protected async change(
    appointment: Appointment,
    command: RescheduleAppointmentCommand,
    actor: Actor,
    now: Date,
  ) {
    const { agenda, service, location } = await this.finder.bookable(command.teamId, command.agendaId);
    if (!location.active) throw new InactiveResourceError('location');
    const previous = appointment.reschedule({ agenda, service, location, time: command.time, now });
    await this.appointments.save(appointment, [
      appointmentEvent({
        appointment,
        type: APPOINTMENT_RESCHEDULED,
        actor,
        occurredAt: now,
        data: { from: slotData(previous) },
      }),
    ]);
  }
}
