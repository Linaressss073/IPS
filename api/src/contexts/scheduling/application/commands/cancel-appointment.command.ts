import { Actor } from '../../../../shared/application/index.js';
import { Appointment } from '../../domain/entities/appointment.entity.js';
import { APPOINTMENT_CANCELLED } from '../constants/trace-event-types.js';
import { appointmentEvent } from '../mappings/appointment-event.mapper.js';
import { CancelAppointmentCommand } from '../types/scheduling.types.js';
import { ChangeAppointment } from './change-appointment.command.js';

/** Cancels with a reason; the slot becomes free for someone else. */
export class CancelAppointment extends ChangeAppointment<CancelAppointmentCommand> {
  protected async change(appointment: Appointment, command: CancelAppointmentCommand, actor: Actor, now: Date) {
    appointment.cancel(command.reason, now);
    await this.appointments.save(appointment, [
      appointmentEvent({
        appointment,
        type: APPOINTMENT_CANCELLED,
        actor,
        occurredAt: now,
        data: { reason: appointment.cancelReason },
      }),
    ]);
  }
}
