export const ORGANIZATION_NAME_MIN_LENGTH = 2;
export const ORGANIZATION_NAME_MAX_LENGTH = 80;

/** NIT base (6-10 digits) and its DIAN check digit: "900123456-8". */
export const NIT_PATTERN = /^(\d{6,10})-(\d)$/;

/** Weights of the DIAN check-digit algorithm, from the rightmost digit. */
export const NIT_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

/** Código de habilitación of the health provider in REPS (Minsalud). */
export const HABILITATION_CODE_PATTERN = /^\d{10,12}$/;

export const ADDRESS_MAX_LENGTH = 200;
export const PLACE_NAME_MAX_LENGTH = 60;

export const ORGANIZATION_STATUSES = ['active', 'deleted'] as const;
