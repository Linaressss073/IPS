/**
 * Database used by the e2e specs. It is wiped before every test, so it must
 * never be the development one: global-setup refuses names not ending in "_test".
 */
export const TEST_MONGO_URL =
  process.env.MONGO_URL_TEST ?? 'mongodb://localhost:27018/?directConnection=true';

export const TEST_MONGO_DB_NAME = process.env.MONGO_DB_NAME_TEST ?? 'his_test';
