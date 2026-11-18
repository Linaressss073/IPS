import request from 'supertest';
import { API_PREFIX } from '../src/config/http.js';
import { createTestApp } from './support/test-app.js';

describe('Error contract (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  const at = (url: string) => `/${API_PREFIX}${url}`;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t?.app.close();
  });

  it('answers a missing token with statusCode, a stable code and a message', async () => {
    const res = await t.api().get('/teams/org_x/patients').expect(401);
    expect(res.body).toEqual({
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: 'Sign in to continue',
    });
  });

  it('answers an unknown route in the same shape', async () => {
    const res = await t.api().get('/no-existe').expect(404);
    expect(res.body).toEqual({
      statusCode: 404,
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested resource does not exist',
    });
  });

  it('answers malformed JSON as a 400 in the same shape', async () => {
    const res = await request(t.app.getHttpServer())
      .post(at('/teams/org_x/patients'))
      .set('Content-Type', 'application/json')
      .send('{"roto":')
      .expect(400);
    expect(res.body).toEqual({
      statusCode: 400,
      code: 'BAD_REQUEST',
      message: 'The request is not valid',
    });
  });

  it('lists the failed fields of an invalid body', async () => {
    const res = await t.api('alice').post('/teams/org_2xTeamA9fKq4LmN8pRsT1uVwY/patients', { extra: 1 }).expect(400);
    expect(res.body).toMatchObject({ statusCode: 400, code: 'BAD_REQUEST', errors: expect.any(Array) });
  });
});
