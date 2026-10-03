import {
  colombiaDate,
  colombiaMinute,
  Entity,
  formatTime,
  generateUuid,
  InvalidValueError,
  isUuid,
  TeamId,
  ValueObject,
} from '../../../../shared/domain/index.js';
import { CHECK_IN_STATUSES, PHARMACY_SERVICE } from '../constants/admission.constants.js';
import {
  AppointmentNotAdmissibleError,
  InvalidTurnTransitionError,
  MaxCallsReachedError,
  NotTodayError,
} from '../errors/admission.errors.js';
import { TurnStatus } from '../types/admission.types.js';
import { CallSettings } from './call-settings.vo.js';

export class TurnId extends ValueObject<string> {
  static generate(): TurnId {
    return new TurnId(generateUuid());
  }

  static of(value: string): TurnId {
    if (!isUuid(value ?? '')) throw new InvalidValueError(`Invalid turn id: "${value}"`);
    return new TurnId(value.toLowerCase());
  }
}

/** What admission needs of the appointment, copied when the patient arrives. */
export interface AppointmentSnapshot {
  id: string;
  status: string;
  patientId: string;
  professionalId: string;
  service: { id: string; code: string; name: string };
  location: { id: string; label: string };
  date: string;
  time: string;
}

/** Why the patient is waiting: an appointment, or a prescription to pick up. */
export type TurnOrigin = { kind: 'cita' } | { kind: 'farmacia'; consultationId: string };

export interface TurnProps {
  teamId: TeamId;
  origin: TurnOrigin;
  /** For pharmacy turns: the pharmacy as service and its window as location. */
  appointment: AppointmentSnapshot;
  /** Per service and day: RTH 1, RTH 2… */
  number: number;
  status: TurnStatus;
  calls: number;
  lastCalledAt: Date | null;
  arrivedAt: Date;
  closedAt: Date | null;
  version: number;
}

/** What an automatic tick did to an announced turn. */
export type AutoAdvance = 'reannounced' | 'no_show' | 'none';

/**
 * Aggregate root: a patient who arrived for today's appointment and waits to
 * be called. en_espera → anunciado (called, re-announced) → atendido, or
 * → no_se_presento after the IPS's last call.
 */
export class Turn extends Entity<TurnId> {
  private constructor(
    id: TurnId,
    private props: TurnProps,
  ) {
    super(id);
  }

  /** The appointment must be today's and still booked. */
  static checkIn(input: {
    teamId: TeamId;
    appointment: AppointmentSnapshot;
    number: number;
    now: Date;
  }): Turn {
    const { appointment } = input;
    if (!(CHECK_IN_STATUSES as readonly string[]).includes(appointment.status)) {
      throw new AppointmentNotAdmissibleError(appointment.status);
    }
    if (appointment.date !== colombiaDate(input.now)) throw new NotTodayError(appointment.date);
    return new Turn(TurnId.generate(), {
      teamId: input.teamId,
      origin: { kind: 'cita' },
      appointment: { ...appointment },
      number: input.number,
      status: 'en_espera',
      calls: 0,
      lastCalledAt: null,
      arrivedAt: input.now,
      closedAt: null,
      version: 1,
    });
  }

  /**
   * A patient at the pharmacy with a signed prescription: a "FAR n" turn at
   * a window. One per prescription and day (the key below is unique).
   */
  static issueForPharmacy(input: {
    teamId: TeamId;
    consultationId: string;
    patientId: string;
    window: { id: string; label: string };
    number: number;
    now: Date;
  }): Turn {
    const date = colombiaDate(input.now);
    return new Turn(TurnId.generate(), {
      teamId: input.teamId,
      origin: { kind: 'farmacia', consultationId: input.consultationId },
      appointment: {
        id: `${input.consultationId}@${date}`,
        status: 'farmacia',
        patientId: input.patientId,
        professionalId: '',
        service: { ...PHARMACY_SERVICE },
        location: input.window,
        date,
        time: formatTime(colombiaMinute(input.now)),
      },
      number: input.number,
      status: 'en_espera',
      calls: 0,
      lastCalledAt: null,
      arrivedAt: input.now,
      closedAt: null,
      version: 1,
    });
  }

  static restore(id: TurnId, props: TurnProps): Turn {
    return new Turn(id, { ...props });
  }

  /** First call, or a manual call again (up to the IPS's limit). */
  call(settings: CallSettings, now: Date): void {
    this.ensureStatus(['en_espera', 'anunciado'], 'called');
    if (this.props.calls >= settings.value.maxCalls) {
      throw new MaxCallsReachedError(settings.value.maxCalls);
    }
    this.props.status = 'anunciado';
    this.props.calls += 1;
    this.props.lastCalledAt = now;
    this.touch();
  }

  /**
   * The automatic step once the interval since the last call has passed:
   * announce again, or close as "no se presentó" after the last call.
   */
  autoAdvance(settings: CallSettings, now: Date): AutoAdvance {
    if (this.props.status !== 'anunciado' || !this.props.lastCalledAt) return 'none';
    if (now.getTime() - this.props.lastCalledAt.getTime() < settings.intervalMs) return 'none';
    if (this.props.calls >= settings.value.maxCalls) {
      this.close('no_se_presento', now);
      return 'no_show';
    }
    this.props.calls += 1;
    this.props.lastCalledAt = now;
    this.touch();
    return 'reannounced';
  }

  /** The professional received the patient (also without a call). */
  attend(now: Date): void {
    this.ensureStatus(['en_espera', 'anunciado'], 'attended');
    this.close('atendido', now);
  }

  markNoShow(now: Date): void {
    this.ensureStatus(['en_espera', 'anunciado'], 'marked as no-show');
    this.close('no_se_presento', now);
  }

  get label(): string {
    return `${this.props.appointment.service.code} ${this.props.number}`;
  }
  get teamId(): TeamId {
    return this.props.teamId;
  }
  get origin(): TurnOrigin {
    return this.props.origin;
  }
  get appointment(): AppointmentSnapshot {
    return this.props.appointment;
  }
  get number(): number {
    return this.props.number;
  }
  get status(): TurnStatus {
    return this.props.status;
  }
  get calls(): number {
    return this.props.calls;
  }
  get lastCalledAt(): Date | null {
    return this.props.lastCalledAt;
  }
  get arrivedAt(): Date {
    return this.props.arrivedAt;
  }
  get closedAt(): Date | null {
    return this.props.closedAt;
  }
  get version(): number {
    return this.props.version;
  }

  private close(status: 'atendido' | 'no_se_presento', now: Date): void {
    this.props.status = status;
    this.props.closedAt = now;
    this.touch();
  }

  private ensureStatus(allowed: TurnStatus[], action: string): void {
    if (!allowed.includes(this.props.status)) {
      throw new InvalidTurnTransitionError(this.props.status, action);
    }
  }

  private touch(): void {
    this.props.version += 1;
  }
}
