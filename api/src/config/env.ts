export type TimelineStore = 'mongo' | 'postgres';

export interface Env {
  PORT: number;
  /** Frontend origins allowed by CORS (normalized, no trailing slash). */
  CORS_ORIGIN: string[];
  DATABASE_URL: string;
  /** Read model for the patient timeline; Postgres stays the source of truth. */
  MONGO_URL?: string;
  /** Which engine answers timeline queries. */
  TIMELINE_STORE: TimelineStore;
  /** How often trace events are copied to Mongo; 0 disables the timer. */
  RELAY_INTERVAL_MS: number;
  /** Clerk secret key (sk_test_… / sk_live_…): verifies tokens, reads memberships. */
  CLERK_SECRET_KEY: string;
  /** Optional PEM public key: verifies tokens without calling Clerk. */
  CLERK_JWT_KEY?: string;
  /** Frontend origins whose tokens are accepted (`azp` claim). */
  CLERK_AUTHORIZED_PARTIES: string[];
  /** Signing secret (whsec_…) of the Clerk webhook; without it the endpoint is off. */
  CLERK_WEBHOOK_SIGNING_SECRET?: string;
}

const REQUIRED = ['DATABASE_URL', 'CLERK_SECRET_KEY'] as const;

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

  const corsOrigin = toOrigins(raw.CORS_ORIGIN || 'http://localhost:3000');

  return {
    PORT: Number(raw.PORT ?? 3001),
    CORS_ORIGIN: corsOrigin,
    DATABASE_URL: raw.DATABASE_URL!,
    MONGO_URL: mongoUrl,
    TIMELINE_STORE: timelineStore,
    RELAY_INTERVAL_MS: Number(raw.RELAY_INTERVAL_MS ?? 500),
    CLERK_SECRET_KEY: raw.CLERK_SECRET_KEY!,
    CLERK_JWT_KEY: raw.CLERK_JWT_KEY || undefined,
    // Comma-separated; by default, the frontends allowed by CORS.
    CLERK_AUTHORIZED_PARTIES: raw.CLERK_AUTHORIZED_PARTIES
      ? toOrigins(raw.CLERK_AUTHORIZED_PARTIES)
      : corsOrigin,
    CLERK_WEBHOOK_SIGNING_SECRET: raw.CLERK_WEBHOOK_SIGNING_SECRET || undefined,
  };
}

/**
 * Comma-separated origins as browsers send them: "https://host" with no
 * path and no trailing slash. A stray "/" (easy to paste from a URL bar)
 * would otherwise make every CORS check and token `azp` check fail.
 */
function toOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}
