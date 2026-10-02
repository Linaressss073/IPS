import { Actor, ActorResolver, Clock } from '../../../../shared/application/index.js';
import { Appointment } from '../../domain/entities/appointment.entity.js';
import { AppointmentVersionConflictError } from '../errors/scheduling.errors.js';
import { AppointmentRepository } from '../ports/scheduling.repositories.port.js';
import { GetAppointment } from '../queries/get-appointment.query.js';
import { SchedulingFinder } from '../services/scheduling-finder.service.js';
import { AppointmentView, ChangeAppointmentCommand } from '../types/scheduling.types.js';

/**
 * Shared steps of confirming, cancelling and rescheduling: load the
 * appointment at the version the client saw, apply the change, save it
 * with its trace event and return the fresh view.
 */
export abstract class ChangeAppointment<C extends ChangeAppointmentCommand> {
  constructor(
    protected readonly appointments: AppointmentRepository,
    protected readonly finder: SchedulingFinder,
    private readonly getAppointment: GetAppointment,
    private readonly actors: ActorResolver,
    protected readonly clock: Clock,
  ) {}

  async execute(command: C): Promise<AppointmentView> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const appointment = await this.finder.appointment(command.teamId, command.appointmentId);
    if (appointment.version !== command.expectedVersion) {
      throw new AppointmentVersionConflictError(command.appointmentId);
    }
    await this.change(appointment, command, actor, this.clock.now());
    return this.getAppointment.execute(command.teamId, appointment.id.value);
  }

  /** Applies the change to the aggregate and saves it with its event. */
  protected abstract change(
    appointment: Appointment,
    command: C,
    actor: Actor,
    now: Date,
  ): Promise<void>;
}
