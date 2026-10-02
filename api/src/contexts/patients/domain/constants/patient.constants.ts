/**
 * Colombian identity documents accepted by the health system:
 * CC cédula de ciudadanía, CE cédula de extranjería, TI tarjeta de identidad,
 * RC registro civil, NIT número de identificación tributaria, PA pasaporte,
 * PPT permiso por protección temporal, PEP permiso especial de permanencia,
 * CD carné diplomático, SC salvoconducto, CN certificado de nacido vivo,
 * AS adulto sin identificación, MS menor sin identificación.
 */
export const DOCUMENT_TYPES = [
  'CC',
  'CE',
  'TI',
  'RC',
  'NIT',
  'PA',
  'PPT',
  'PEP',
  'CD',
  'SC',
  'CN',
  'AS',
  'MS',
] as const;

/** Documents whose number is only digits. */
export const NUMERIC_DOCUMENT_TYPES: readonly string[] = [
  'CC',
  'TI',
  'RC',
  'NIT',
  'CN',
];

/** After removing spaces, dots and dashes (e.g. "1.000.123.456" -> "1000123456"). */
export const DOCUMENT_NUMBER_PATTERN = /^[A-Z0-9]{3,20}$/;

/** Biological sex as reported in RIPS: hombre, mujer, indeterminado. */
export const SEXES = ['H', 'M', 'I'] as const;

/** Health insurance regime; "particular" means the patient pays directly. */
export const REGIMES = [
  'contributivo',
  'subsidiado',
  'especial',
  'particular',
] as const;

/** How a companion is related to the patient. */
export const RELATIONSHIPS = [
  'madre',
  'padre',
  'hijo',
  'conyuge',
  'hermano',
  'familiar',
  'cuidador',
  'otro',
] as const;

export const NAME_MAX_LENGTH = 60;
/** Letters (with accents), spaces, apostrophes and dashes. */
export const NAME_PATTERN = /^\p{L}[\p{L}' -]*$/u;

export const EMAIL_MAX_LENGTH = 254;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** After removing spaces, dashes and parentheses: optional "+" and 7-15 digits. */
export const PHONE_PATTERN = /^\+?\d{7,15}$/;

export const ADDRESS_MAX_LENGTH = 200;
export const EPS_MAX_LENGTH = 120;
export const MAX_AGE_YEARS = 130;
