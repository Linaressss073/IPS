import { TeamId, UserId } from '../../../../shared/domain/index.js';

/** Raw patient data as received from a client, before domain validation. */
export interface PatientInput {
  document: { type: string; number: string };
  name: {
    firstName: string;
    middleName?: string | null;
    firstLastName: string;
    secondLastName?: string | null;
  };
  birthDate: string;
  sex: string;
  contact: { email: string; phone?: string | null; address?: string | null };
  affiliation: { eps?: string | null; regime: string };
}

/** Raw companion data; every field optional but a name or a phone is required. */
export interface CompanionInput {
  relationship?: string | null;
  name?: PatientInput['name'] | null;
  document?: PatientInput['document'] | null;
  phone?: string | null;
  email?: string | null;
}

/** Who executes the command and, optionally, who asked for it. */
export interface ActorInput {
  executedBy: UserId;
  requestedBy?: UserId;
}

export interface PatientRef {
  teamId: TeamId;
  patientId: string;
}

// Commands (write side)

export interface RegisterPatientCommand extends PatientInput {
  teamId: TeamId;
  actor: ActorInput;
  /** Optional first companion, recorded as #1 in the same transaction. */
  companion?: CompanionInput | null;
}

export interface RecordCompanionCommand extends PatientRef {
  companion: CompanionInput;
  actor: ActorInput;
}

/**
 * Each group present (document, name, contact…) replaces the current one as
 * a whole. `expectedVersion` is the version the client read: if the patient
 * changed since then the update is rejected instead of overwriting.
 */
export interface UpdatePatientCommand extends PatientRef {
  expectedVersion: number;
  changes: Partial<PatientInput>;
  actor: ActorInput;
}

// Queries (read side)

export interface SearchPatientsQuery {
  teamId: TeamId;
  /** Free text: document number and/or names, accents and case ignored. */
  q?: string;
  page?: number;
  pageSize?: number;
}

// Read models

export interface PatientView {
  id: string;
  document: { type: string; number: string };
  name: {
    firstName: string;
    middleName: string | null;
    firstLastName: string;
    secondLastName: string | null;
  };
  fullName: string;
  birthDate: string;
  sex: string;
  contact: { email: string; phone: string | null; address: string | null };
  affiliation: { eps: string | null; regime: string };
  version: number;
  registeredAt: string;
  updatedAt: string;
}

export interface TimelineEntryView {
  id: string;
  type: string;
  occurredAt: string;
  requestedBy: string;
  executedBy: string;
  data: Record<string, unknown>;
}

/** One companion of the patient's history; `number` grows with each one. */
export interface CompanionView {
  number: number;
  relationship: string | null;
  name: {
    firstName: string;
    middleName: string | null;
    firstLastName: string;
    secondLastName: string | null;
  } | null;
  fullName: string | null;
  document: { type: string; number: string } | null;
  phone: string | null;
  email: string | null;
  recordedAt: string;
  requestedBy: string;
  executedBy: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
