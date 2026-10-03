import { ActorInput } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';

// Commands

export interface CheckInCommand {
  teamId: TeamId;
  appointmentId: string;
  actor: ActorInput;
}

export interface TurnCommand {
  teamId: TeamId;
  turnId: string;
  /** The version the client read; a stale one is rejected (409). */
  expectedVersion: number;
  actor: ActorInput;
}

export interface IssuePharmacyTurnCommand {
  teamId: TeamId;
  consultationId: string;
  patientId: string;
  window: { id: string; label: string };
  actor: ActorInput;
}

export interface UpdateCallSettingsCommand {
  teamId: TeamId;
  announceIntervalSeconds: number;
  maxCalls: number;
  actor: ActorInput;
}

// Queries

export interface ListTurnsQuery {
  teamId: TeamId;
  /** Defaults to today in Colombia. */
  date?: string;
  status?: string;
  professionalId?: string;
}

// Read models

export interface TurnView {
  id: string;
  label: string;
  /** Waiting for an appointment, or to pick up a prescription at the pharmacy. */
  origin: { kind: 'cita' } | { kind: 'farmacia'; consultationId: string };
  code: string;
  number: number;
  status: string;
  calls: number;
  lastCalledAt: string | null;
  arrivedAt: string;
  closedAt: string | null;
  date: string;
  appointment: { id: string; time: string };
  patient: {
    id: string;
    fullName: string | null;
    shortName: string | null;
    document: { type: string; number: string } | null;
  };
  professional: { userId: string; displayName: string | null };
  service: { id: string; code: string; name: string };
  location: { id: string; label: string };
  version: number;
}

/** One call shown on the waiting-room screen (no document, no full name). */
export interface BoardCall {
  turnId: string;
  label: string;
  location: string;
  patientName: string | null;
  status: string;
  calls: number;
  calledAt: string;
}

export interface BoardView {
  /** The latest turn being announced, shown large. */
  current: BoardCall | null;
  /** The previous calls, most recent first. */
  recent: BoardCall[];
  settings: CallSettingsView;
}

export interface CallSettingsView {
  announceIntervalSeconds: number;
  maxCalls: number;
}
