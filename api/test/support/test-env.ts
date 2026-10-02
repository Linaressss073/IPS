/**
 * Databases used by the e2e specs. They are wiped before every test, so
 * they must never be the development ones: global-setup refuses to run
 * unless both names end in "_test".
 */
export const TEST_DATABASE_URL =
  process.env.DATABASE_URL_TEST ?? 'postgres://b2b:b2b@localhost:5433/b2b_test';

export const TEST_MONGO_URL =
  process.env.MONGO_URL_TEST ?? 'mongodb://localhost:27017/his_test';
