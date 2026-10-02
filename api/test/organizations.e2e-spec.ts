import request from 'supertest';
import { ORGANIZATIONS_COLLECTION } from '../src/contexts/organizations/infrastructure/persistence/mongo-organization.repository.js';
import { signedWebhook } from './support/clerk-webhook.js';
import { createTestApp, TEAM_A, TEAM_B } from './support/test-app.js';

describe('Organizations API (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  const api = (token?: string) => t.api(token);
  const ipsA = `/organizations/${TEAM_A}`;

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.mongo.collection(ORGANIZATIONS_COLLECTION).deleteMany({});
    t.organizationProvider.reset();
  });

  afterAll(async () => {
    await t?.app.close();
  });

  it('imports the IPS from the provider into the organizations collection', async () => {
    const res = await api('carol').get(ipsA).expect(200);
    expect(res.body).toMatchObject({
      id: TEAM_A,
      name: 'IPS Alfa',
      nit: null,
      status: 'active',
      version: 1,
    });
    expect(
      await t.mongo.collection(ORGANIZATIONS_COLLECTION).countDocuments({ _id: TEAM_A as never }),
    ).toBe(1);

    await api('bob').get(ipsA).expect(403);
    await api().get(ipsA).expect(401);
  });

  it('lets only administrators update it, with optimistic locking', async () => {
    const forbidden = await api('carol').patch(ipsA, { version: 1, city: 'Cali' }).expect(403);
    expect(forbidden.body.code).toBe('TEAM_ADMIN_REQUIRED');

    const updated = await api('alice')
      .patch(ipsA, {
        version: 1,
        name: 'IPS Alfa Sur',
        nit: '890.903.938-8',
        habilitationCode: '110010000001',
        city: 'Bogotá',
        email: 'Contacto@IPSAlfa.co',
      })
      .expect(200);
    expect(updated.body).toMatchObject({
      name: 'IPS Alfa Sur',
      nit: '890903938-8',
      habilitationCode: '110010000001',
      city: 'Bogotá',
      email: 'contacto@ipsalfa.co',
      version: 2,
    });
    expect(t.organizationProvider.renamed).toEqual(['IPS Alfa Sur']);

    const stale = await api('alice').patch(ipsA, { version: 1, city: 'Cali' }).expect(409);
    expect(stale.body.code).toBe('ORGANIZATION_VERSION_CONFLICT');

    const badNit = await api('alice').patch(ipsA, { version: 2, nit: '890903938-1' }).expect(400);
    expect(badNit.body.code).toBe('INVALID_VALUE');
  });

  it('deletes access in the provider and leaves a tombstone', async () => {
    await api('carol').delete(ipsA).expect(403);
    await api('alice').delete(ipsA).expect(204);

    expect(t.organizationProvider.deleted).toEqual([TEAM_A]);
    const doc = await t.mongo
      .collection(ORGANIZATIONS_COLLECTION)
      .findOne({ _id: TEAM_A as never });
    expect(doc).toMatchObject({ status: 'deleted', deletedBy: 'alice' });
    expect((await api('alice').get(ipsA).expect(404)).body.code).toBe(
      'ORGANIZATION_NOT_FOUND',
    );
    // The other IPS is untouched.
    await api('bob').get(`/organizations/${TEAM_B}`).expect(200);
  });

  it('follows name changes made in Clerk through webhooks', async () => {
    await api('alice').get(ipsA).expect(200);
    const { body, headers } = signedWebhook({
      type: 'organization.updated',
      data: { id: TEAM_A, name: 'IPS Alfa (Clerk)', updated_at: Date.parse('2026-10-03T00:00:00Z') },
    });
    await request(t.app.getHttpServer())
      .post('/api/v1/webhooks/clerk')
      .set(headers)
      .send(body)
      .expect(200);

    expect((await api('alice').get(ipsA).expect(200)).body).toMatchObject({
      name: 'IPS Alfa (Clerk)',
      version: 2,
    });
  });
});
