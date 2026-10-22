import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { TEST_MONGO_DB_NAME } from './test-env.js';

const MONGO_PORT = 27017;
// Pinned: recent mongo:8 builds refuse to start on Linux kernels >= 6.19 (SERVER-121912), which some CI runners have.
const MONGO_IMAGE = 'mongo:8.0.4';

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
  process.env.MONGO_URL = `mongodb://${mongo.getHost()}:${mongo.getMappedPort(MONGO_PORT)}/?directConnection=true`;
  return async () => {
    await mongo.stop();
  };
}

/** One-node replica set, ready when it has elected itself primary (no Docker healthcheck: flaky on CI). */
async function startMongo(): Promise<StartedTestContainer> {
  const mongo = await new GenericContainer(MONGO_IMAGE)
    .withExposedPorts(MONGO_PORT)
    .withCommand(['--replSet', 'rs0', '--bind_ip_all'])
    .withWaitStrategy(Wait.forLogMessage(/Waiting for connections/))
    .start();
  const shell = (script: string) => mongo.exec(['mongosh', '--quiet', '--eval', script]);

  await shell('rs.initiate()');
  for (let attempt = 0; attempt < 60; attempt++) {
    const { output } = await shell('db.hello().isWritablePrimary');
    if (output.trim() === 'true') return mongo;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  await mongo.stop();
  throw new Error('MongoDB replica set did not elect a primary in 30 s');
}
