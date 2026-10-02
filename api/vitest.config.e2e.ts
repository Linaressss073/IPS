import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { TEST_WEBHOOK_SECRET } from './test/support/clerk-webhook.js';
import { TEST_MONGO_URL } from './test/support/test-env.js';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Refuses databases whose name does not end in "_test".
    globalSetup: ['./test/support/global-setup.ts'],
    // Specs share one database and wipe it: run files one at a time.
    fileParallelism: false,
    // Real MongoDB with a database of its own that the specs wipe (never
    // the development one); Clerk is faked in the specs.
    env: {
      ENV: 'test',
      MONGO_URL: TEST_MONGO_URL,
      CLERK_SECRET_KEY: 'sk_test_e2e',
      CLERK_WEBHOOK_SIGNING_SECRET: TEST_WEBHOOK_SECRET,
    },
  },
});
