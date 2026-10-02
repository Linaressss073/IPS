import type { Db } from 'mongodb';
import { AppointmentStatus } from '../../domain/types/scheduling.types.js';

export const SERVICES_COLLECTION = 'scheduling_services';
export const LOCATIONS_COLLECTION = 'scheduling_locations';
export const AGENDAS_COLLECTION = 'scheduling_agendas';
export const APPOINTMENTS_COLLECTION = 'scheduling_appointments';

/** Index names checked when a unique index rejects a write. */
export const SLOT_INDEX = 'slot_uq';
export const PATIENT_TIME_INDEX = 'patient_time_uq';

export interface ServiceDocument {
  _id: string;
  teamId: string;
  code: string;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationDocument {
  _id: string;
  teamId: string;
  kind: string;
  number: string;
  /** Lower-case, accent-free kind + upper-case number: "vacunacion"/"101". */
  key: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgendaDocument {
  _id: string;
  teamId: string;
  professionalId: string;
  serviceId: string;
  locationId: string;
  date: string;
  startMinute: number;
  endMinute: number;
  slotMinutes: number;
  createdAt: Date;
}

export interface AppointmentDocument {
  _id: string;
  teamId: string;
  patientId: string;
  agendaId: string;
  professionalId: string;
  service: { id: string; code: string; name: string };
  location: { id: string; label: string };
  date: string;
  startMinute: number;
  endMinute: number;
  startsAt: Date;
  status: AppointmentStatus;
  /** False once cancelled: only active appointments hold their slot. */
  active: boolean;
  cancelReason: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function ensureSchedulingIndexes(db: Db): Promise<void> {
  await Promise.all([
    db
      .collection(SERVICES_COLLECTION)
      .createIndex({ teamId: 1, code: 1 }, { unique: true, name: 'team_code_uq' }),
    db
      .collection(LOCATIONS_COLLECTION)
      .createIndex({ teamId: 1, key: 1 }, { unique: true, name: 'team_key_uq' }),
    db.collection(AGENDAS_COLLECTION).createIndexes([
      { key: { teamId: 1, date: 1, professionalId: 1 }, name: 'team_date_professional' },
      { key: { teamId: 1, date: 1, locationId: 1 }, name: 'team_date_location' },
    ]),
    db.collection(APPOINTMENTS_COLLECTION).createIndexes([
      // One active appointment per slot, and per patient and time.
      {
        key: { agendaId: 1, startMinute: 1 },
        name: SLOT_INDEX,
        unique: true,
        partialFilterExpression: { active: true },
      },
      {
        key: { teamId: 1, patientId: 1, startsAt: 1 },
        name: PATIENT_TIME_INDEX,
        unique: true,
        partialFilterExpression: { active: true },
      },
      { key: { teamId: 1, date: 1, startsAt: 1 }, name: 'team_date' },
      { key: { teamId: 1, professionalId: 1, startsAt: 1 }, name: 'team_professional' },
    ]),
  ]);
}
