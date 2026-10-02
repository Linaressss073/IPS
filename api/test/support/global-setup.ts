import { TEST_MONGO_URL } from './test-env.js';

/**
 * Runs once before the e2e specs: refuses any database that is not a test
 * one, so `pnpm test:e2e` can never wipe development or production data.
 */
export default function setup(): void {
  const database = new URL(TEST_MONGO_URL).pathname.slice(1);
  if (!database.endsWith('_test')) {
    throw new Error(
      `E2E specs wipe their database; refusing to use "${database}" (the name must end in "_test").`,
    );
  }
}
