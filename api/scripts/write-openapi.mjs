// Rewrites api/openapi.json from the running app's OpenAPI document (via the docs e2e test, which needs Docker).
import { execSync } from 'node:child_process';

execSync('pnpm exec vitest run --config ./vitest.config.e2e.ts test/docs.e2e-spec.ts', {
  stdio: 'inherit',
  env: { ...process.env, UPDATE_OPENAPI: '1' },
});
