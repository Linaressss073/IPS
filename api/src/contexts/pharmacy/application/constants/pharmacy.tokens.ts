export const DISPENSATION_REPOSITORY = Symbol('DispensationRepository');
export const PRESCRIPTION_SOURCE = Symbol('PharmacyPrescriptionSource');
export const PHARMACY_TURNS = Symbol('PharmacyTurns');
export const PHARMACY_WINDOWS = Symbol('PharmacyWindows');
export const PHARMACY_NAMES = Symbol('PharmacyNames');
export const PHARMACY_TEAM_MEMBERS = Symbol('PharmacyTeamMembers');

/**
 * Patient timeline event. Units only, no medication names: the timeline is
 * visible to roles that must not infer diagnoses from medications.
 */
export const MEDICATIONS_DELIVERED = 'pharmacy.dispensed';
