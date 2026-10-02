import { ActorResolver, Clock } from '../../../../shared/application/index.js';
import { Appointment } from '../../domain/entities/appointment.entity.js';
import { APPOINTMENT_SCHEDULED } from '../constants/trace-event-types.js';
import { InactiveResourceError, SchedulingNotFoundError } from '../errors/scheduling.errors.js';
import { appointmentEvent } from '../mappings/appointment-event.mapper.js';
import { PatientDirectory } from '../ports/other-contexts.port.js';
import { AppointmentRepository } from '../ports/scheduling.repositories.port.js';
import { GetAppointment } from '../queries/get-appointment.query.js';
import { SchedulingFinder } from '../services/scheduling-finder.service.js';
import { AppointmentView, ScheduleAppointmentCommand } from '../types/scheduling.types.js';

/**
 * Books a registered patient in a free slot. The slot and the patient's
 * time are guarded by unique indexes, so two simultaneous bookings of the
 * same slot never both succeed.
 */
export class ScheduleAppointment {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly finder: SchedulingFinder,
    private readonly patients: PatientDirectory,
    private readonly getAppointment: GetAppointment,
    private readonly actors: ActorResolver,
    private readonly clock: Clock,
  ) {}

  async execute(command: ScheduleAppointmentCommand): Promise<AppointmentView> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const [{ agenda, service, location }, patients] = await Promise.all([
      this.finder.bookable(command.teamId, command.agendaId),
      this.patients.summaries(command.teamId, [command.patientId]),
    ]);
    if (!patients.has(command.patientId)) {
      throw new SchedulingNotFoundError('PATIENT', command.patientId);
    }
    if (!service.active) throw new InactiveResourceError('service');
    if (!location.active) throw new InactiveResourceError('location');

    const now = this.clock.now();
    const appointment = Appointment.schedule({
      teamId: command.teamId,
      patientId: command.patientId,
      agenda,
      service,
      location,
      time: command.time,
      now,
    });
    await this.appointments.add(appointment, [
      appointmentEvent({ appointment, type: APPOINTMENT_SCHEDULED, actor, occurredAt: now }),
    ]);
    return this.getAppointment.execute(command.teamId, appointment.id.value);
  }
}
