import type { ClientSession, Db } from 'mongodb';
import { TraceEvent } from '../../application/types/trace-event.types.js';
import { TRACE_EVENTS_COLLECTION, TraceEventDocument } from './mongo.js';

/**
 * Appends trace events inside the caller's transaction, so a change and its
 * events are committed (or rolled back) together.
 */
export async function appendTraceEvents(
  db: Db,
  events: readonly TraceEvent[],
  session: ClientSession,
): Promise<void> {
  if (events.length === 0) return;
  await db.collection<TraceEventDocument>(TRACE_EVENTS_COLLECTION).insertMany(
    events.map((event, seq) => ({
      _id: event.id,
      teamId: event.teamId,
      patientId: event.patientId,
      type: event.type,
      requestedBy: event.requestedBy,
      executedBy: event.executedBy,
      occurredAt: event.occurredAt,
      seq,
      data: event.data,
    })),
    { session },
  );
}

/** A patient's journey is read by team + patient, oldest first. */
export async function ensureTraceEventIndexes(db: Db): Promise<void> {
  await db
    .collection(TRACE_EVENTS_COLLECTION)
    .createIndex({ teamId: 1, patientId: 1, occurredAt: 1, seq: 1 });
}
