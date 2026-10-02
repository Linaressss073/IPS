import { APPOINTMENT_STATUSES } from '../constants/scheduling.constants.js';

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
