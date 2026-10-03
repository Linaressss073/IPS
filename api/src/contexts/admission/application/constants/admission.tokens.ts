export const TURN_REPOSITORY = Symbol('TurnRepository');
export const CALL_SETTINGS_REPOSITORY = Symbol('CallSettingsRepository');
export const TURN_READ_MODEL = Symbol('TurnReadModel');
export const APPOINTMENT_DIRECTORY = Symbol('AdmissionAppointmentDirectory');
export const ADMISSION_PATIENTS = Symbol('AdmissionPatients');
export const ADMISSION_STAFF_NAMES = Symbol('AdmissionStaffNames');
export const ADMISSION_TEAM_MEMBERS = Symbol('AdmissionTeamMembers');

/** Trace event types written by the Admission context (patient timeline). */
export const TURN_CHECKED_IN = 'turn.checked_in';
export const TURN_CALLED = 'turn.called';
export const TURN_ATTENDED = 'turn.attended';
export const TURN_NO_SHOW = 'turn.no_show';
export const CALL_SETTINGS_UPDATED = 'admission.settings_updated';

/** Actor of the automatic re-announcements and no-shows. */
export const SYSTEM_USER = 'system';
