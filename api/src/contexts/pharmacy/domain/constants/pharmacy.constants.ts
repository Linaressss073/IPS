/**
 * pendiente: nothing delivered yet.
 * parcial: some units delivered, some pending (e.g. out of stock).
 * completa: everything prescribed was delivered.
 */
export const DISPENSATION_STATUSES = ['pendiente', 'parcial', 'completa'] as const;

export const DELIVERY_NOTE_MAX = 500;
