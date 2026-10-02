import {
  char,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/** Persistence model of the Patient aggregate (write side and read model). */
export const patients = pgTable(
  'patients_patients',
  {
    id: uuid('id').primaryKey(),
    // Identity-provider organization id (e.g. Clerk "org_…"), not a UUID.
    teamId: varchar('team_id', { length: 64 }).notNull(),
    documentType: varchar('document_type', { length: 4 }).notNull(),
    documentNumber: varchar('document_number', { length: 20 }).notNull(),
    firstName: text('first_name').notNull(),
    middleName: text('middle_name'),
    firstLastName: text('first_last_name').notNull(),
    secondLastName: text('second_last_name'),
    birthDate: date('birth_date', { mode: 'string' }).notNull(),
    sex: char('sex', { length: 1 }).notNull(),
    email: text('email').notNull(),
    phone: varchar('phone', { length: 16 }),
    address: text('address'),
    eps: text('eps'),
    regime: varchar('regime', { length: 16 }).notNull(),
    /** Lower-case, accent-free document number and names, for searching. */
    searchText: text('search_text').notNull(),
    version: integer('version').notNull(),
    registeredAt: timestamp('registered_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('patients_patients_team_document_uq').on(
      table.teamId,
      table.documentType,
      table.documentNumber,
    ),
    index('patients_patients_team_name_idx').on(
      table.teamId,
      table.firstLastName,
      table.firstName,
    ),
  ],
);

export type PatientRow = typeof patients.$inferSelect;
