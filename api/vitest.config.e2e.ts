import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { TEST_WEBHOOK_SECRET } from './test/support/clerk-webhook.js';
import { TEST_DATABASE_URL, TEST_MONGO_URL } from './test/support/test-env.js';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Creates and migrates the test database; refuses non-"_test" databases.
    globalSetup: ['./test/support/global-setup.ts'],
    // Specs share one database and truncate tables: run files one at a time.
    fileParallelism: false,
    // Real Postgres and Mongo, each with a database of its own that the specs
    // wipe (never the development ones); Clerk is faked in the specs.
    env: {
      ENV: 'test',
      DATABASE_URL: TEST_DATABASE_URL,
      MONGO_URL: TEST_MONGO_URL,
      TIMELINE_STORE: 'mongo',
      // No timer: specs publish to Mongo explicitly with relay.flush().
      RELAY_INTERVAL_MS: '0',
      CLERK_SECRET_KEY: 'sk_test_e2e',
      CLERK_WEBHOOK_SIGNING_SECRET: TEST_WEBHOOK_SECRET,
    },
  },
});
