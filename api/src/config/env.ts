export type TimelineStore = 'mongo' | 'postgres';

export interface Env {
  PORT: number;
  CORS_ORIGIN: string;
  DATABASE_URL: string;
  /** Read model for the patient timeline; Postgres stays the source of truth. */
  MONGO_URL?: string;
  /** Which engine answers timeline queries. */
  TIMELINE_STORE: TimelineStore;
  /** How often trace events are copied to Mongo; 0 disables the timer. */
  RELAY_INTERVAL_MS: number;
  HEXCLAVE_API_URL: string;
  HEXCLAVE_PROJECT_ID: string;
  HEXCLAVE_SECRET_SERVER_KEY: string;
  HEXCLAVE_PUBLISHABLE_CLIENT_KEY?: string;
}

const REQUIRED = [
  'DATABASE_URL',
  'HEXCLAVE_PROJECT_ID',
  'HEXCLAVE_SECRET_SERVER_KEY',
] as const;

const TIMELINE_STORES: readonly TimelineStore[] = ['mongo', 'postgres'];

/** Used by ConfigModule: fails fast at boot if the environment is incomplete. */
export function validateEnv(raw: Record<string, string | undefined>): Env {
  const missing = REQUIRED.filter((key) => !raw[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  const mongoUrl = raw.MONGO_URL || undefined;
  const timelineStore = (raw.TIMELINE_STORE ||
    (mongoUrl ? 'mongo' : 'postgres')) as TimelineStore;
  if (!TIMELINE_STORES.includes(timelineStore)) {
    throw new Error(
      `TIMELINE_STORE must be one of: ${TIMELINE_STORES.join(', ')}`,
    );
  }
  if (timelineStore === 'mongo' && !mongoUrl) {
    throw new Error('TIMELINE_STORE=mongo requires MONGO_URL');
  }

  return {
    PORT: Number(raw.PORT ?? 3001),
    CORS_ORIGIN: raw.CORS_ORIGIN ?? 'http://localhost:3000',
    DATABASE_URL: raw.DATABASE_URL!,
    MONGO_URL: mongoUrl,
    TIMELINE_STORE: timelineStore,
    RELAY_INTERVAL_MS: Number(raw.RELAY_INTERVAL_MS ?? 500),
    HEXCLAVE_API_URL: raw.HEXCLAVE_API_URL ?? 'https://api.hexclave.com',
    HEXCLAVE_PROJECT_ID: raw.HEXCLAVE_PROJECT_ID!,
    HEXCLAVE_SECRET_SERVER_KEY: raw.HEXCLAVE_SECRET_SERVER_KEY!,
    HEXCLAVE_PUBLISHABLE_CLIENT_KEY:
      raw.HEXCLAVE_PUBLISHABLE_CLIENT_KEY || undefined,
  };
}
