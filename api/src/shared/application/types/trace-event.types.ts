import { TeamId, UserId, generateUuid } from '../../domain/index.js';

/**
 * Who asked for a change and who carried it out. Both are users of the
 * system; when nobody else asked, the requester is the executor.
 */
export interface Actor {
  requestedBy: UserId;
  executedBy: UserId;
}

/**
 * One step of a patient's journey (registered, updated, and later
 * scheduled, admitted, attended…). Append-only: never updated or deleted.
 * Written in the same transaction as the change it describes.
 */
export interface TraceEvent {
  id: string;
  teamId: string;
  patientId: string | null;
  type: string;
  requestedBy: string;
  executedBy: string;
  occurredAt: Date;
  data: Record<string, unknown>;
}

export function newTraceEvent(input: {
  teamId: TeamId;
  patientId: string | null;
  type: string;
  actor: Actor;
  occurredAt: Date;
  data: Record<string, unknown>;
}): TraceEvent {
  return {
    id: generateUuid(),
    teamId: input.teamId.value,
    patientId: input.patientId,
    type: input.type,
    requestedBy: input.actor.requestedBy.value,
    executedBy: input.actor.executedBy.value,
    occurredAt: input.occurredAt,
    data: input.data,
  };
}
