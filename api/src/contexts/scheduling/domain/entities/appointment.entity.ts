import { Entity, InvalidValueError, TeamId } from '../../../../shared/domain/index.js';
import {
  CANCEL_REASON_MAX_LENGTH,
  CANCEL_REASON_MIN_LENGTH,
} from '../constants/scheduling.constants.js';
import {
  InvalidAppointmentTransitionError,
  PastScheduleError,
  RescheduleServiceMismatchError,
  SlotNotInAgendaError,
} from '../errors/scheduling.errors.js';
import { AppointmentStatus } from '../types/scheduling.types.js';
import { formatTime, parseTime } from '../utils/colombia-time.js';
import { requiredText } from '../utils/text.js';
import { Agenda } from './agenda.entity.js';
import { CareLocation } from './care-location.entity.js';
import { MedicalService } from './medical-service.entity.js';
import { SchedulingId } from './scheduling-id.vo.js';

/**
 * Where and with whom, copied from the agenda when booked so the turn
 * screen and the history keep showing what the patient was told.
 */
export interface AppointmentSlot {
  agendaId: SchedulingId;
  professionalId: string;
  service: { id: string; code: string; name: string };
  location: { id: string; label: string };
  date: string;
  startMinute: number;
  endMinute: number;
  startsAt: Date;
}

export interface AppointmentProps {
  teamId: TeamId;
  patientId: string;
  slot: AppointmentSlot;
  status: AppointmentStatus;
  cancelReason: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Aggregate root: a patient booked in one slot of an agenda.
 * agendada -> confirmada -> (admission) ; agendada|confirmada -> cancelada.
 * Rescheduling moves it to another slot of the same service and leaves it
 * "agendada" again (the patient has to confirm the new time).
 */
export class Appointment extends Entity<SchedulingId> {
  private constructor(
    id: SchedulingId,
    private props: AppointmentProps,
  ) {
    super(id);
  }

  static schedule(input: {
    teamId: TeamId;
    patientId: string;
    agenda: Agenda;
    service: MedicalService;
    location: CareLocation;
    time: string;
    now: Date;
  }): Appointment {
    return new Appointment(SchedulingId.generate(), {
      teamId: input.teamId,
      patientId: input.patientId,
      slot: slotFor(input.agenda, input.service, input.location, input.time, input.now),
      status: 'agendada',
      cancelReason: null,
      version: 1,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  static restore(id: SchedulingId, props: AppointmentProps): Appointment {
    return new Appointment(id, { ...props, slot: { ...props.slot } });
  }

  confirm(now: Date): void {
    this.ensureStatus(['agendada'], 'confirmed');
    this.props.status = 'confirmada';
    this.touch(now);
  }

  cancel(reason: string, now: Date): void {
    this.ensureStatus(['agendada', 'confirmada'], 'cancelled');
    this.props.cancelReason = requiredText(
      reason,
      'reason',
      CANCEL_REASON_MAX_LENGTH,
      CANCEL_REASON_MIN_LENGTH,
    );
    this.props.status = 'cancelada';
    this.touch(now);
  }

  /** Returns the slot it had before. */
  reschedule(input: {
    agenda: Agenda;
    service: MedicalService;
    location: CareLocation;
    time: string;
    now: Date;
  }): AppointmentSlot {
    this.ensureStatus(['agendada', 'confirmada'], 'rescheduled');
    if (input.agenda.serviceId.value !== this.props.slot.service.id) {
      throw new RescheduleServiceMismatchError();
    }
    const previous = this.props.slot;
    this.props.slot = slotFor(input.agenda, input.service, input.location, input.time, input.now);
    this.props.status = 'agendada';
    this.touch(input.now);
    return previous;
  }

  /** Active appointments hold their slot; cancelled ones free it. */
  get active(): boolean {
    return this.props.status !== 'cancelada';
  }
  get teamId(): TeamId {
    return this.props.teamId;
  }
  get patientId(): string {
    return this.props.patientId;
  }
  get slot(): AppointmentSlot {
    return this.props.slot;
  }
  get status(): AppointmentStatus {
    return this.props.status;
  }
  get cancelReason(): string | null {
    return this.props.cancelReason;
  }
  get version(): number {
    return this.props.version;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private ensureStatus(allowed: AppointmentStatus[], action: string): void {
    if (!allowed.includes(this.props.status)) {
      throw new InvalidAppointmentTransitionError(this.props.status, action);
    }
  }

  private touch(now: Date): void {
    this.props.version += 1;
    this.props.updatedAt = now;
  }
}

function slotFor(
  agenda: Agenda,
  service: MedicalService,
  location: CareLocation,
  time: string,
  now: Date,
): AppointmentSlot {
  const startMinute = parseTime(time);
  if (!agenda.hasSlot(startMinute)) throw new SlotNotInAgendaError(formatTime(startMinute));
  if (!service.id.equals(agenda.serviceId) || !location.id.equals(agenda.locationId)) {
    throw new InvalidValueError('service and location must be the agenda ones');
  }
  const startsAt = agenda.instantOf(startMinute);
  if (startsAt.getTime() <= now.getTime()) throw new PastScheduleError('An appointment');
  return {
    agendaId: agenda.id,
    professionalId: agenda.professionalId,
    service: { id: service.id.value, code: service.code.value, name: service.name },
    location: { id: location.id.value, label: location.label },
    date: agenda.date,
    startMinute,
    endMinute: startMinute + agenda.slotMinutes,
    startsAt,
  };
}
