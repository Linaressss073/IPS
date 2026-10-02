export const PG_UNIQUE_VIOLATION = '23505';

/** drizzle wraps driver errors, so the pg code may sit on `cause`. */
export function pgErrorCode(error: unknown): string | undefined {
  const candidates = [error, (error as { cause?: unknown })?.cause];
  for (const candidate of candidates) {
    const code = (candidate as { code?: unknown })?.code;
    if (typeof code === 'string') return code;
  }
  return undefined;
}
