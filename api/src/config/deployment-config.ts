import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const DEPLOYMENT_ENVIRONMENTS = ['dev', 'test', 'prod'] as const;
export type DeploymentEnvironment = (typeof DEPLOYMENT_ENVIRONMENTS)[number];

/**
 * Settings of the environment named by ENV (default "dev"), from
 * `deployment/config.json` (committed, no secrets) and
 * `deployment/secrets.<env>.json` (git-ignored, optional). Secrets override
 * config; the caller lets real environment variables override both, so a
 * host like Render can still set values in its dashboard.
 */
export function loadDeploymentConfig(
  env: string = process.env.ENV || 'dev',
  directory: string = join(process.cwd(), 'deployment'),
): Record<string, string> {
  if (!DEPLOYMENT_ENVIRONMENTS.includes(env as DeploymentEnvironment)) {
    throw new Error(
      `ENV must be one of: ${DEPLOYMENT_ENVIRONMENTS.join(', ')} (got "${env}")`,
    );
  }

  const configPath = join(directory, 'config.json');
  const config = existsSync(configPath)
    ? (readJson(configPath) as Record<string, Record<string, unknown>>)[env] ?? {}
    : {};
  const secretsPath = join(directory, `secrets.${env}.json`);
  const secrets = existsSync(secretsPath) ? readJson(secretsPath) : {};

  return { ...asStrings(config), ...asStrings(secrets) };
}

function readJson(path: string): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Invalid JSON in ${path}: ${String(error)}`);
  }
}

/** Environment variables are strings; empty values count as "not set". */
function asStrings(values: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );
}
