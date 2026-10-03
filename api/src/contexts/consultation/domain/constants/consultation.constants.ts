/** Vital signs that can be recorded, with their unit and plausible range. */
export const VITAL_SIGNS = {
  presion_sistolica: { unit: 'mmHg', min: 50, max: 260, decimals: 0 },
  presion_diastolica: { unit: 'mmHg', min: 30, max: 160, decimals: 0 },
  frecuencia_cardiaca: { unit: 'lpm', min: 20, max: 250, decimals: 0 },
  frecuencia_respiratoria: { unit: 'rpm', min: 5, max: 80, decimals: 0 },
  temperatura: { unit: '°C', min: 30, max: 45, decimals: 1 },
  saturacion_oxigeno: { unit: '%', min: 50, max: 100, decimals: 0 },
  peso: { unit: 'kg', min: 0.3, max: 400, decimals: 1 },
  talla: { unit: 'cm', min: 20, max: 250, decimals: 0 },
} as const;

/** CIE-10: a letter, two digits and an optional subcategory (J06.9, E11.9, R51). */
export const ICD10_PATTERN = /^[A-Z][0-9]{2}(\.[0-9A-Z]{1,2})?$/;

export const ROUTES = [
  'oral',
  'sublingual',
  'intravenosa',
  'intramuscular',
  'subcutanea',
  'topica',
  'inhalada',
  'oftalmica',
  'otica',
  'nasal',
  'rectal',
  'vaginal',
  'transdermica',
] as const;

/** Free-text limits (characters). */
export const NOTE_FIELD_MAX = 4000;
export const SHORT_TEXT_MAX = 200;
export const MAX_DIAGNOSES = 10;
export const MAX_PRESCRIPTION_ITEMS = 20;
export const MAX_TREATMENT_DAYS = 365;
export const MAX_QUANTITY = 1000;

/**
 * en_curso: the physician is writing it (a draft).
 * firmada: signed; it can no longer change, only receive addenda.
 */
export const CONSULTATION_STATUSES = ['en_curso', 'firmada'] as const;
