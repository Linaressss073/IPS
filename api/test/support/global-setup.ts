import { MongoDBContainer } from '@testcontainers/mongodb';
import { TEST_MONGO_DB_NAME } from './test-env.js';

/**
 * Runs once before the e2e specs. Refuses any database that is not a test
 * one, so `pnpm test:e2e` can never wipe development or production data, and
 * starts a throwaway MongoDB replica set (transactions need one) that is
 * removed afterwards. Set MONGO_URL_TEST to use an already running MongoDB.
 */
export default async function setup(): Promise<(() => Promise<void>) | undefined> {
  const database = TEST_MONGO_DB_NAME;
  if (!database.endsWith('_test')) {
    throw new Error(
      `E2E specs wipe their database; refusing to use "${database}" (the name must end in "_test").`,
    );
  }

  if (process.env.MONGO_URL_TEST) {
    process.env.MONGO_URL = process.env.MONGO_URL_TEST;
    return undefined;
  }

  const mongo = await startMongo();
  // directConnection: the replica set advertises the container's internal hostname.
  process.env.MONGO_URL = `${mongo.getConnectionString()}/?directConnection=true`;
  return async () => {
    await mongo.stop();
  };
}

/** The container healthcheck is occasionally slow on shared CI runners: retry before failing. */
async function startMongo() {
  for (let attempt = 1; ; attempt++) {
    try {
      return await new MongoDBContainer('mongo:8').start();
    } catch (error) {
      if (attempt === 3) throw error;
    }
  }
}
