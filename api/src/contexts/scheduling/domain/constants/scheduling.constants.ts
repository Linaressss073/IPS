/** Shortest and longest appointment slot an agenda can be split into. */
export const MIN_SLOT_MINUTES = 5;
export const MAX_SLOT_MINUTES = 240;

/**
 * Prefix of a service, shown on the turn screen ("RTH 4"): 2 to 4 letters,
 * unique in the IPS.
 */
export const SERVICE_CODE_PATTERN = /^[A-Z]{2,4}$/;
export const SERVICE_NAME_MAX_LENGTH = 80;

/** A place where patients are called: kind + number ("Consultorio 502"). */
export const LOCATION_KIND_MAX_LENGTH = 40;
export const LOCATION_NUMBER_PATTERN = /^[A-Za-z0-9-]{1,10}$/;

export const CANCEL_REASON_MIN_LENGTH = 3;
export const CANCEL_REASON_MAX_LENGTH = 200;

/**
 * Life of an appointment in scheduling. Admission continues it later
 * (waiting on site → called → attended / no-show).
 */
export const APPOINTMENT_STATUSES = ['agendada', 'confirmada', 'cancelada'] as const;
