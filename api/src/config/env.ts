export interface Env {
  PORT: number;
  /** Frontend origins allowed by CORS (normalized, no trailing slash). */
  CORS_ORIGIN: string[];
  /** MongoDB, the only database (Atlas or the docker-compose replica set). */
  MONGO_URL: string;
  /**
   * Database inside MONGO_URL: MONGO_DB_NAME, or else the URL's path. Never
   * left to the driver, whose default ("test") says nothing.
   */
  MONGO_DB_NAME: string;
  /** Clerk secret key (sk_test_… / sk_live_…): verifies tokens, reads memberships. */
  CLERK_SECRET_KEY: string;
  /** Optional PEM public key: verifies tokens without calling Clerk. */
  CLERK_JWT_KEY?: string;
  /** Frontend origins whose tokens are accepted (`azp` claim). */
  CLERK_AUTHORIZED_PARTIES: string[];
  /** Signing secret (whsec_…) of the Clerk webhook; without it the endpoint is off. */
  CLERK_WEBHOOK_SIGNING_SECRET?: string;
}

const REQUIRED = ['MONGO_URL', 'CLERK_SECRET_KEY'] as const;

/** Used by ConfigModule: fails fast at boot if the environment is incomplete. */
export function validateEnv(raw: Record<string, string | undefined>): Env {
  const missing = REQUIRED.filter((key) => !raw[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  const mongoDbName = raw.MONGO_DB_NAME || databaseInUrl(raw.MONGO_URL!);
  if (!mongoDbName) {
    throw new Error('Set MONGO_DB_NAME (or put the database name in the MONGO_URL path)');
  }

  const corsOrigin = toOrigins(raw.CORS_ORIGIN || 'http://localhost:3000');

  return {
    PORT: Number(raw.PORT ?? 3001),
    CORS_ORIGIN: corsOrigin,
    MONGO_URL: raw.MONGO_URL!,
    MONGO_DB_NAME: mongoDbName,
    CLERK_SECRET_KEY: raw.CLERK_SECRET_KEY!,
    CLERK_JWT_KEY: raw.CLERK_JWT_KEY || undefined,
    // Comma-separated; by default, the frontends allowed by CORS.
    CLERK_AUTHORIZED_PARTIES: raw.CLERK_AUTHORIZED_PARTIES
      ? toOrigins(raw.CLERK_AUTHORIZED_PARTIES)
      : corsOrigin,
    CLERK_WEBHOOK_SIGNING_SECRET: raw.CLERK_WEBHOOK_SIGNING_SECRET || undefined,
  };
}

/** "mongodb+srv://u:p@host/his?x=1" -> "his"; "" when the URL names none. */
function databaseInUrl(url: string): string {
  const match = /^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/.exec(url);
  return decodeURIComponent(match?.[1] ?? '');
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
