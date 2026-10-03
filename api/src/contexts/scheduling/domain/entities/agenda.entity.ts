import { colombiaDate, colombiaInstant, Entity, formatTime, parseCalendarDate, parseTime, TeamId } from '../../../../shared/domain/index.js';
import { MAX_SLOT_MINUTES, MIN_SLOT_MINUTES } from '../constants/scheduling.constants.js';
import { InvalidAgendaError, PastScheduleError } from '../errors/scheduling.errors.js';
import { SchedulingId } from './scheduling-id.vo.js';

export interface AgendaProps {
  teamId: TeamId;
  /** Staff member with the "medico" role who attends. */
  professionalId: string;
  serviceId: SchedulingId;
  locationId: SchedulingId;
  /** Colombian calendar date and minutes from midnight. */
  date: string;
  startMinute: number;
  endMinute: number;
  slotMinutes: number;
  createdAt: Date;
}

/**
 * A block of a professional's time for one service in one place, split into
 * equal slots: "Dr. X, Medicina general, Consultorio 502, 5 Oct 07:00-12:00
 * every 20 min". Each slot holds at most one active appointment.
 */
export class Agenda extends Entity<SchedulingId> {
  private constructor(
    id: SchedulingId,
    private readonly props: AgendaProps,
  ) {
    super(id);
  }

  static open(input: {
    teamId: TeamId;
    professionalId: string;
    serviceId: SchedulingId;
    locationId: SchedulingId;
    date: string;
    startTime: string;
    endTime: string;
    slotMinutes: number;
    now: Date;
  }): Agenda {
    const date = parseCalendarDate(input.date);
    const startMinute = parseTime(input.startTime, 'startTime');
    const endMinute = parseTime(input.endTime, 'endTime');
    const slot = input.slotMinutes;
    if (!Number.isInteger(slot) || slot < MIN_SLOT_MINUTES || slot > MAX_SLOT_MINUTES) {
      throw new InvalidAgendaError(
        'INVALID_SLOT_MINUTES',
        `slotMinutes must be a whole number from ${MIN_SLOT_MINUTES} to ${MAX_SLOT_MINUTES}`,
      );
    }
    if (endMinute <= startMinute) {
      throw new InvalidAgendaError('AGENDA_END_BEFORE_START', 'endTime must be after startTime');
    }
    const length = endMinute - startMinute;
    if (length % slot !== 0) {
      // E.g. 21:00-22:30 is 90 min: with 20-min slots it ends at 22:20 or 22:40.
      const shorter = startMinute + Math.floor(length / slot) * slot;
      throw new InvalidAgendaError(
        'AGENDA_SLOTS_NOT_WHOLE',
        `The block ${formatTime(startMinute)}-${formatTime(endMinute)} (${length} min) does not split into whole ` +
          `${slot}-minute slots: end it at ${formatTime(shorter)} or ${formatTime(shorter + slot)}`,
      );
    }
    if (date < colombiaDate(input.now)) throw new PastScheduleError('An agenda');

    return new Agenda(SchedulingId.generate(), {
      teamId: input.teamId,
      professionalId: input.professionalId,
      serviceId: input.serviceId,
      locationId: input.locationId,
      date,
      startMinute,
      endMinute,
      slotMinutes: slot,
      createdAt: input.now,
    });
  }

  static restore(id: SchedulingId, props: AgendaProps): Agenda {
    return new Agenda(id, { ...props });
  }

  /** Start minute of every slot. */
  slots(): number[] {
    const starts: number[] = [];
    for (let m = this.startMinute; m < this.endMinute; m += this.slotMinutes) starts.push(m);
    return starts;
  }

  hasSlot(minute: number): boolean {
    return (
      minute >= this.startMinute &&
      minute < this.endMinute &&
      (minute - this.startMinute) % this.slotMinutes === 0
    );
  }

  instantOf(minute: number): Date {
    return colombiaInstant(this.date, minute);
  }

  get teamId(): TeamId {
    return this.props.teamId;
  }
  get professionalId(): string {
    return this.props.professionalId;
  }
  get serviceId(): SchedulingId {
    return this.props.serviceId;
  }
  get locationId(): SchedulingId {
    return this.props.locationId;
  }
  get date(): string {
    return this.props.date;
  }
  get startMinute(): number {
    return this.props.startMinute;
  }
  get endMinute(): number {
    return this.props.endMinute;
  }
  get slotMinutes(): number {
    return this.props.slotMinutes;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
