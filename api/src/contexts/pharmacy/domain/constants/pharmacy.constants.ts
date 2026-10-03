/**
 * pendiente: nothing delivered yet.
 * parcial: some units delivered, some pending (e.g. out of stock).
 * completa: everything prescribed was delivered.
 */
export const DISPENSATION_STATUSES = ['pendiente', 'parcial', 'completa'] as const;

export const DELIVERY_NOTE_MAX = 500;

/** Lots expiring within these days show in the "por vencer" alert. */
export const EXPIRY_WARNING_DAYS = 30;

export const PRODUCT_TEXT_MAX = 120;
export const LOT_NUMBER_PATTERN = /^[A-Za-z0-9-]{1,30}$/;
export const ADJUSTMENT_REASON = { min: 3, max: 200 } as const;
export const MAX_RECEIPT_QUANTITY = 100_000;

/** entrada: a lot received; salida: dispensed; ajuste: correction or write-off (with a reason). */
export const MOVEMENT_TYPES = ['entrada', 'salida', 'ajuste'] as const;
