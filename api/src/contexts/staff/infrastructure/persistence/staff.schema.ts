import { sql } from 'drizzle-orm';
import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Local copy of the identity provider's users, minimized: a display name and
 * a masked e-mail only. Deleted users keep their (pseudonymous) id so the
 * audit trail still links, but lose every personal field.
 */
export const staffUsers = pgTable('staff_users', {
  userId: varchar('user_id', { length: 64 }).primaryKey(),
  displayName: text('display_name'),
  emailMasked: text('email_masked'),
  sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

/** Who belongs to which IPS, with the provider role and our functional roles. */
export const staffMemberships = pgTable(
  'staff_memberships',
  {
    teamId: varchar('team_id', { length: 64 }).notNull(),
    userId: varchar('user_id', { length: 64 }).notNull(),
    providerRole: varchar('provider_role', { length: 64 }).notNull(),
    /** agendamiento, admision, medico, farmacia, soporte (assigned by admins). */
    roles: text('roles').array().notNull().default(sql`'{}'::text[]`),
    sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.teamId, table.userId] }),
    index('staff_memberships_user_id_idx').on(table.userId),
  ],
);

export type StaffUserRow = typeof staffUsers.$inferSelect;
export type StaffMembershipRow = typeof staffMemberships.$inferSelect;
