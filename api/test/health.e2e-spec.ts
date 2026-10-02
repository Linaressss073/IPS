import request from 'supertest';
import { createTestApp } from './support/test-app.js';

describe('Health API (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await t?.app.close();
  });

  it('reports ok without a token when the database is up', async () => {
    const res = await t.api().get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', database: 'up' });
  });

  it('is only served under the /api/v1 prefix', async () => {
    await request(t.app.getHttpServer()).get('/api/v1/health').expect(200);
    await request(t.app.getHttpServer()).get('/health').expect(404);
  });

  it('answers 503 when the database is unreachable', async () => {
    vi.spyOn(t.mongo, 'command').mockRejectedValueOnce(
      new Error('connection refused'),
    );

    const res = await t.api().get('/health').expect(503);
    expect(res.body).toEqual({ status: 'degraded', database: 'down' });
  });
});
