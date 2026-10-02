import { Actor } from '../../../../shared/application/index.js';
import { Appointment } from '../../domain/entities/appointment.entity.js';
import { APPOINTMENT_CONFIRMED } from '../constants/trace-event-types.js';
import { appointmentEvent } from '../mappings/appointment-event.mapper.js';
import { ChangeAppointmentCommand } from '../types/scheduling.types.js';
import { ChangeAppointment } from './change-appointment.command.js';

/** The patient confirmed they will come (agendada -> confirmada). */
export class ConfirmAppointment extends ChangeAppointment<ChangeAppointmentCommand> {
  protected async change(appointment: Appointment, _: ChangeAppointmentCommand, actor: Actor, now: Date) {
    appointment.confirm(now);
    await this.appointments.save(appointment, [
      appointmentEvent({ appointment, type: APPOINTMENT_CONFIRMED, actor, occurredAt: now }),
    ]);
  }
}
