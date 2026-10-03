import { TraceEvent } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import { CallSettings } from '../../domain/entities/call-settings.vo.js';
import { AppointmentSnapshot, Turn, TurnId } from '../../domain/entities/turn.entity.js';
import { ListTurnsQuery, TurnView } from '../types/admission.types.js';

/** Port (write side): turns; every write stores its trace events atomically. */
export interface TurnRepository {
  /** Throws TurnNotFoundError if the team has no such turn. */
  getById(teamId: TeamId, id: TurnId): Promise<Turn>;

  /**
   * Takes the next number of the service for the day and stores the turn
   * built with it, in one transaction. Throws AlreadyCheckedInError if the
   * appointment already has a turn.
   */
  checkIn(
    teamId: TeamId,
    numbering: { date: string; code: string },
    build: (number: number) => { turn: Turn; events: TraceEvent[] },
  ): Promise<Turn>;

  /** Saves a turn whose version was bumped; TurnVersionConflictError if stale. */
  save(turn: Turn, events: readonly TraceEvent[]): Promise<void>;

  /** Announced turns (every IPS) last called before `calledBefore`. */
  findAnnouncedBefore(calledBefore: Date): Promise<Turn[]>;
}

export interface CallSettingsRepository {
  /** The IPS's settings, or the defaults. */
  get(teamId: TeamId): Promise<CallSettings>;
  save(teamId: TeamId, settings: CallSettings, events: readonly TraceEvent[]): Promise<void>;
}

/** Port (read side): turns as views; names of other contexts come back null. */
export interface TurnReadModel {
  /** Throws TurnNotFoundError if the team has no such turn. */
  getById(teamId: TeamId, turnId: string): Promise<TurnView>;
  list(query: ListTurnsQuery & { date: string }): Promise<TurnView[]>;
  /** Turns of the day that were called, most recent call first. */
  calledOn(teamId: TeamId, date: string, limit: number): Promise<TurnView[]>;
}

/** Port to Scheduling: the appointment being checked in. */
export interface AppointmentDirectory {
  /** Throws (404 APPOINTMENT_NOT_FOUND) if the team has no such appointment. */
  get(teamId: TeamId, appointmentId: string): Promise<AppointmentSnapshot>;
}

/** Port to Patients: names to show. */
export interface AdmissionPatients {
  summaries(
    teamId: TeamId,
    patientIds: readonly string[],
  ): Promise<Map<string, { fullName: string; shortName: string; document: { type: string; number: string } }>>;
}

/** Port to Staff: professionals' names. */
export interface AdmissionStaffNames {
  namesFor(userIds: readonly string[]): Promise<Map<string, string>>;
}
