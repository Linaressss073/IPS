import { sql } from 'drizzle-orm';
import {
  bigserial,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Append-only log of every traced change. It is both the audit trail
 * (source of truth for "what happened to this patient") and the outbox the
 * relay copies to the Mongo read model: `published_at` is null until copied.
 */
export const traceEvents = pgTable(
  'shared_trace_events',
  {
    id: uuid('id').primaryKey(),
    // Insertion order: the relay publishes in this order.
    position: bigserial('position', { mode: 'number' }).notNull().unique(),
    // Identity-provider organization id (e.g. Clerk "org_…"), not a UUID.
    teamId: varchar('team_id', { length: 64 }).notNull(),
    patientId: uuid('patient_id'),
    type: varchar('type', { length: 64 }).notNull(),
    requestedBy: text('requested_by').notNull(),
    executedBy: text('executed_by').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    data: jsonb('data').$type<Record<string, unknown>>().notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
  },
  (table) => [
    index('shared_trace_events_team_patient_idx').on(
      table.teamId,
      table.patientId,
      table.occurredAt,
    ),
    // Keeps the relay's "what is still pending" lookup small.
    index('shared_trace_events_unpublished_idx')
      .on(table.position)
      .where(sql`${table.publishedAt} is null`),
  ],
);

export type TraceEventRow = typeof traceEvents.$inferSelect;
