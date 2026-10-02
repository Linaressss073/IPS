import type { Db } from 'mongodb';

export const MONGO_CLIENT = Symbol('MongoClient');
/** The Mongo database, or null when MONGO_URL is not configured. */
export const MONGO_DB = Symbol('MongoDb');

export type MongoDatabase = Db | null;

/** Read model: one document per trace event, copied from Postgres by the relay. */
export const TIMELINE_COLLECTION = 'patient_timeline';

export interface TimelineDocument {
  _id: string;
  position: number;
  teamId: string;
  patientId: string | null;
  type: string;
  requestedBy: string;
  executedBy: string;
  occurredAt: Date;
  data: Record<string, unknown>;
}
