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
      dev: { PORT: 3001, MONGO_URL: 'mongodb://dev/his', CORS_ORIGIN: 'http://localhost:3000' },
      prod: { CORS_ORIGIN: 'https://ips-web.onrender.com' },
    }),
  );
  writeFileSync(
    join(directory, 'secrets.dev.json'),
    JSON.stringify({ CLERK_SECRET_KEY: 'sk_test_x', MONGO_URL: 'mongodb://secret/his', CLERK_JWT_KEY: '' }),
  );

  it('merges the environment config with its secrets (secrets win)', () => {
    expect(loadDeploymentConfig('dev', directory)).toEqual({
      PORT: '3001',
      MONGO_URL: 'mongodb://secret/his',
      CORS_ORIGIN: 'http://localhost:3000',
      CLERK_SECRET_KEY: 'sk_test_x',
    });
  });

  it('works without a secrets file and rejects unknown environments', () => {
    expect(loadDeploymentConfig('prod', directory)).toEqual({
      CORS_ORIGIN: 'https://ips-web.onrender.com',
    });
    expect(() => loadDeploymentConfig('staging', directory)).toThrow('ENV must be one of');
  });

  it('normalizes CORS origins and uses them as Clerk authorized parties', () => {
    const env = validateEnv({
      MONGO_URL: 'mongodb://x/his',
      CLERK_SECRET_KEY: 'sk_test_x',
      CORS_ORIGIN: ' https://ips-web.onrender.com/ , http://localhost:3000',
    });
    expect(env.CORS_ORIGIN).toEqual(['https://ips-web.onrender.com', 'http://localhost:3000']);
    expect(env.CLERK_AUTHORIZED_PARTIES).toEqual(env.CORS_ORIGIN);
  });

  it('lets real environment variables override the files', () => {
    const env = validateEnv({
      ...loadDeploymentConfig('dev', directory),
      MONGO_URL: 'mongodb+srv://from-render/his',
    });
    expect(env).toMatchObject({ MONGO_URL: 'mongodb+srv://from-render/his', PORT: 3001 });
  });
});
