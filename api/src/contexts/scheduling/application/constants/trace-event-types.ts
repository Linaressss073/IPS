/** Trace event types written by the Scheduling context. */

// Configuration of the IPS (no patient).
export const SERVICE_CREATED = 'scheduling.service_created';
export const SERVICE_UPDATED = 'scheduling.service_updated';
export const LOCATION_CREATED = 'scheduling.location_created';
export const LOCATION_UPDATED = 'scheduling.location_updated';
export const AGENDA_OPENED = 'scheduling.agenda_opened';
export const AGENDA_DELETED = 'scheduling.agenda_deleted';

// The patient's journey: they show in the patient timeline.
export const APPOINTMENT_SCHEDULED = 'appointment.scheduled';
export const APPOINTMENT_CONFIRMED = 'appointment.confirmed';
export const APPOINTMENT_CANCELLED = 'appointment.cancelled';
export const APPOINTMENT_RESCHEDULED = 'appointment.rescheduled';
