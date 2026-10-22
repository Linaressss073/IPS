import { defineConfig } from 'vitest/config';
import { TEST_WEBHOOK_SECRET } from './test/support/clerk-webhook.js';
import { TEST_MONGO_DB_NAME } from './test/support/test-env.js';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Refuses databases whose name does not end in "_test".
    globalSetup: ['./test/support/global-setup.ts'],
    // Specs share one database and wipe it: run files one at a time.
    fileParallelism: false,
    // MONGO_URL comes from global-setup (a Testcontainers MongoDB). The specs
    // wipe their own database (never the development one); Clerk is faked.
    env: {
      ENV: 'test',
      MONGO_DB_NAME: TEST_MONGO_DB_NAME,
      CLERK_SECRET_KEY: 'sk_test_e2e',
      // Clerk is faked: no periodic reconciliation against the real one.
      CLERK_SYNC_INTERVAL_MS: '0',
      // Specs advance the turn announcements by hand (with a later clock).
      TURN_ANNOUNCER_INTERVAL_MS: '0',
      CLERK_WEBHOOK_SIGNING_SECRET: TEST_WEBHOOK_SECRET,
    },
  },
});
