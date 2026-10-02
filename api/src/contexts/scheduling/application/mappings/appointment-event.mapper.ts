import { Actor, newTraceEvent, TraceEvent } from '../../../../shared/application/index.js';
import { Appointment, AppointmentSlot } from '../../domain/entities/appointment.entity.js';
import { formatTime } from '../../domain/utils/colombia-time.js';

/** What the patient's history shows of a slot (names are resolved when read). */
export function slotData(slot: AppointmentSlot): Record<string, unknown> {
  return {
    service: slot.service,
    location: slot.location,
    professionalId: slot.professionalId,
    date: slot.date,
    time: formatTime(slot.startMinute),
    startsAt: slot.startsAt.toISOString(),
  };
}

/** A step of the appointment, traced in the patient's timeline. */
export function appointmentEvent(input: {
  appointment: Appointment;
  type: string;
  actor: Actor;
  occurredAt: Date;
  data?: Record<string, unknown>;
}): TraceEvent {
  const { appointment } = input;
  return newTraceEvent({
    teamId: appointment.teamId,
    patientId: appointment.patientId,
    type: input.type,
    actor: input.actor,
    occurredAt: input.occurredAt,
    data: {
      appointmentId: appointment.id.value,
      status: appointment.status,
      ...slotData(appointment.slot),
      ...input.data,
    },
  });
}
