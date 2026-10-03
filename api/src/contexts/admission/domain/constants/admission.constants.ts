/**
 * en_espera: the patient arrived and has a turn.
 * anunciado: the turn is on the waiting-room screen (and re-announced).
 * atendido: the professional received the patient (closes the turn).
 * no_se_presento: nobody came after every call (closes the turn).
 */
export const TURN_STATUSES = ['en_espera', 'anunciado', 'atendido', 'no_se_presento'] as const;

/** Appointment statuses that can check in (scheduling's "agendada"/"confirmada"). */
export const CHECK_IN_STATUSES = ['agendada', 'confirmada'] as const;

/** What an IPS gets until an administrator changes it. */
export const DEFAULT_ANNOUNCE_INTERVAL_SECONDS = 120;
export const DEFAULT_MAX_CALLS = 3;

export const ANNOUNCE_INTERVAL_LIMITS = { min: 30, max: 900 } as const;
export const MAX_CALLS_LIMITS = { min: 1, max: 5 } as const;
