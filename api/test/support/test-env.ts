/**
 * Database used by the e2e specs. It is wiped before every test, so it must
 * never be the development one: global-setup refuses names not ending in "_test".
 */
export const TEST_MONGO_URL =
  process.env.MONGO_URL_TEST ?? 'mongodb://localhost:27018/his_test?directConnection=true';
