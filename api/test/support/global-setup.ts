import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';
import { TEST_DATABASE_URL, TEST_MONGO_URL } from './test-env.js';

/**
 * Runs once before the e2e specs: refuses any database that is not a test
 * one, creates the Postgres test database if missing and applies the
 * migrations, so `pnpm test:e2e` only needs the containers running.
 */
export default async function setup(): Promise<void> {
  const postgres = new URL(TEST_DATABASE_URL);
  const database = postgres.pathname.slice(1);
  const mongoDatabase = new URL(TEST_MONGO_URL).pathname.slice(1);
  for (const name of [database, mongoDatabase]) {
    if (!name.endsWith('_test')) {
      throw new Error(
        `E2E specs wipe their databases; refusing to use "${name}" (the name must end in "_test").`,
      );
    }
  }

  const maintenance = new URL(postgres);
  maintenance.pathname = '/postgres';
  const admin = new Client({ connectionString: maintenance.toString() });
  await admin.connect();
  try {
    const { rowCount } = await admin.query(
      'select 1 from pg_database where datname = $1',
      [database],
    );
    if (!rowCount) await admin.query(`create database "${database}"`);
  } finally {
    await admin.end();
  }

  const client = new Client({ connectionString: TEST_DATABASE_URL });
  await client.connect();
  try {
    await migrate(drizzle({ client }), { migrationsFolder: './drizzle' });
  } finally {
    await client.end();
  }
}
