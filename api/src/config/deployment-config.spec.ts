import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadDeploymentConfig } from './deployment-config.js';
import { validateEnv } from './env.js';

describe('loadDeploymentConfig', () => {
  const directory = mkdtempSync(join(tmpdir(), 'deployment-'));
  writeFileSync(
    join(directory, 'config.json'),
    JSON.stringify({
      dev: { PORT: 3001, DATABASE_URL: 'postgres://dev', TIMELINE_STORE: 'postgres' },
      prod: { CORS_ORIGIN: 'https://ips-web.onrender.com' },
    }),
  );
  writeFileSync(
    join(directory, 'secrets.dev.json'),
    JSON.stringify({ CLERK_SECRET_KEY: 'sk_test_x', DATABASE_URL: 'postgres://secret', CLERK_JWT_KEY: '' }),
  );

  it('merges the environment config with its secrets (secrets win)', () => {
    expect(loadDeploymentConfig('dev', directory)).toEqual({
      PORT: '3001',
      DATABASE_URL: 'postgres://secret',
      TIMELINE_STORE: 'postgres',
      CLERK_SECRET_KEY: 'sk_test_x',
    });
  });

  it('works without a secrets file and rejects unknown environments', () => {
    expect(loadDeploymentConfig('prod', directory)).toEqual({
      CORS_ORIGIN: 'https://ips-web.onrender.com',
    });
    expect(() => loadDeploymentConfig('staging', directory)).toThrow('ENV must be one of');
  });

  it('lets real environment variables override the files', () => {
    const env = validateEnv({
      ...loadDeploymentConfig('dev', directory),
      DATABASE_URL: 'postgres://from-render',
    });
    expect(env).toMatchObject({ DATABASE_URL: 'postgres://from-render', PORT: 3001 });
  });
});
