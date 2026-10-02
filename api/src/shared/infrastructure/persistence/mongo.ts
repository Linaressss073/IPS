import {
  MongoServerError,
  type ClientSession,
  type Db,
  type MongoClient,
} from 'mongodb';

export const MONGO_CLIENT = Symbol('MongoClient');
export const MONGO_DB = Symbol('MongoDb');

export type MongoDatabase = Db;

/**
 * Append-only log of every traced change: the audit trail and the patient's
 * timeline. Written in the same transaction as the change it describes.
 */
export const TRACE_EVENTS_COLLECTION = 'trace_events';

export interface TraceEventDocument {
  _id: string;
  teamId: string;
  patientId: string | null;
  type: string;
  requestedBy: string;
  executedBy: string;
  occurredAt: Date;
  /** Order among events written together (same `occurredAt`). */
  seq: number;
  data: Record<string, unknown>;
}

const DUPLICATE_KEY = 11000;

export function isDuplicateKey(error: unknown): boolean {
  return error instanceof MongoServerError && error.code === DUPLICATE_KEY;
}

/**
 * Runs `work` in a multi-document transaction (needs a replica set: Atlas,
 * or the docker-compose one). Transient conflicts are retried by the driver,
 * so `work` must only touch the database through `session`.
 */
export function inTransaction<T>(
  client: MongoClient,
  work: (session: ClientSession) => Promise<T>,
): Promise<T> {
  return client.withSession((session) =>
    session.withTransaction(() => work(session)),
  );
}
