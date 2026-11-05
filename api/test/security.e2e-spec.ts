import request from 'supertest';
import { API_PREFIX } from '../src/config/http.js';
import { createTestApp } from './support/test-app.js';

describe('HTTP security (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  const at = (url: string) => `/${API_PREFIX}${url}`;
  const raw = () => request(t.app.getHttpServer());

  beforeAll(async () => {
    t = await createTestApp({ rateLimitPerMinute: 3 });
  });

  afterAll(async () => {
    await t?.app.close();
  });

  it('sends the standard security headers and hides the framework', async () => {
    const res = await raw().get(at('/health')).expect(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBeDefined();
    expect(res.headers['strict-transport-security']).toMatch(/max-age=\d+/);
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('answers 429 above the limit, per client, and never limits /health', async () => {
    const asClient = (ip: string) => raw().get(at('/teams/org_x/patients')).set('CF-Connecting-IP', ip);
    for (let i = 0; i < 3; i++) await asClient('203.0.113.7').expect(401);

    const limited = await asClient('203.0.113.7').expect(429);
    expect(limited.body).toEqual({
      statusCode: 429,
      code: 'TOO_MANY_REQUESTS',
      message: expect.any(String),
    });
    expect(limited.headers['ratelimit']).toBeDefined();

    // Another client has its own counter, and /health is never limited.
    await asClient('203.0.113.8').expect(401);
    for (let i = 0; i < 5; i++) await raw().get(at('/health')).set('CF-Connecting-IP', '203.0.113.7').expect(200);
  });
});
