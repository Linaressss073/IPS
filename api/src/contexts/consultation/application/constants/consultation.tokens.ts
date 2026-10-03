export const CONSULTATION_REPOSITORY = Symbol('ConsultationRepository');
export const CONSULTATION_READ_MODEL = Symbol('ConsultationReadModel');
export const CONSULTATION_APPOINTMENTS = Symbol('ConsultationAppointments');
export const CONSULTATION_NAMES = Symbol('ConsultationNames');
export const CONSULTATION_TEAM_MEMBERS = Symbol('ConsultationTeamMembers');

/**
 * Patient timeline events. They carry no clinical content (the timeline is
 * visible to every role that reads patients): only which consultation.
 */
export const CONSULTATION_STARTED = 'consultation.started';
export const CONSULTATION_SIGNED = 'consultation.signed';
export const CONSULTATION_ADDENDUM_ADDED = 'consultation.addendum_added';
