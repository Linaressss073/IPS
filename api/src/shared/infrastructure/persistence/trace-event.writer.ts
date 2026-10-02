import { TraceEvent } from '../../application/types/trace-event.types.js';
import { Database } from './database.module.js';
import { traceEvents } from './trace-events.schema.js';

/**
 * Appends trace events using the caller's transaction, so a change and its
 * events are committed (or rolled back) together.
 */
export async function appendTraceEvents(
  tx: Pick<Database, 'insert'>,
  events: readonly TraceEvent[],
): Promise<void> {
  if (events.length === 0) return;
  await tx.insert(traceEvents).values(
    events.map((event) => ({
      id: event.id,
      teamId: event.teamId,
      patientId: event.patientId,
      type: event.type,
      requestedBy: event.requestedBy,
      executedBy: event.executedBy,
      occurredAt: event.occurredAt,
      data: event.data,
    })),
  );
}
