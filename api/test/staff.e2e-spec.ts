import { sql } from 'drizzle-orm';
import request from 'supertest';
import { STAFF_COLLECTION } from '../src/contexts/staff/infrastructure/read-models/mongo-staff.projection.js';
import { signedWebhook } from './support/clerk-webhook.js';
import { createTestApp, TEAM_A, TEAM_B } from './support/test-app.js';

describe('Staff directory (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  const api = (token?: string) => t.api(token);

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.db.execute(
      sql`truncate table staff_users, staff_memberships, patients_patients, shared_trace_events`,
    );
    await t.mongo.collection(STAFF_COLLECTION).deleteMany({});
  });

  afterAll(async () => {
    await t?.app.close();
  });

  const send = (payload: object) => {
    const { body, headers } = signedWebhook(payload);
    return request(t.app.getHttpServer())
      .post('/api/v1/webhooks/clerk')
      .set(headers)
      .send(body);
  };

  const user = (id: string, first: string, email: string, updatedAt: number) => ({
    type: 'user.updated',
    data: {
      id,
      first_name: first,
      last_name: 'Gómez',
      username: null,
      primary_email_address_id: 'idn_1',
      email_addresses: [{ id: 'idn_1', email_address: email }],
      phone_numbers: [{ phone_number: '+573001234567' }],
      updated_at: updatedAt,
    },
  });

  const membership = (type: string, teamId: string, userId: string) => ({
    type,
    data: {
      role: 'org:member',
      updated_at: 1790924973700,
      organization: { id: teamId },
      public_user_data: {
        user_id: userId,
        first_name: null,
        last_name: null,
        identifier: 'x@y.co',
      },
    },
  });

  it('rejects unsigned or tampered webhooks', async () => {
    await request(t.app.getHttpServer())
      .post('/api/v1/webhooks/clerk')
      .send(user('alice', 'Alicia', 'alicia@clinica.com.co', 1))
      .expect(400);

    const { body, headers } = signedWebhook(user('alice', 'Alicia', 'a@b.co', 1));
    await request(t.app.getHttpServer())
      .post('/api/v1/webhooks/clerk')
      .set(headers)
      .send(body.replace('Alicia', 'Mallory'))
      .expect(400);
  });

  it('stores only the name and a masked e-mail, for members of the IPS', async () => {
    await send(user('alice', 'Alicia', 'alicia.gomez@clinica.com.co', 1000)).expect(200);
    await send(membership('organizationMembership.created', TEAM_A, 'alice')).expect(200);

    const staff = (await api('alice').get(`/teams/${TEAM_A}/staff`).expect(200)).body;
    expect(staff).toEqual([
      {
        userId: 'alice',
        displayName: 'Alicia Gómez',
        emailMasked: 'ali****@cli***.c**',
        providerRole: 'org:member',
        clinicalRole: null,
      },
    ]);

    const [row] = (
      await t.db.execute(sql`select * from staff_users where user_id = 'alice'`)
    ).rows;
    expect(JSON.stringify(row)).not.toMatch(/alicia\.gomez|573001234567/);

    // The MongoDB copy has the same minimized data, with the IPS memberships.
    const doc = await t.mongo
      .collection(STAFF_COLLECTION)
      .findOne({ _id: 'alice' as never });
    expect(doc).toMatchObject({
      displayName: 'Alicia Gómez',
      emailMasked: 'ali****@cli***.c**',
      deleted: false,
      teams: [{ teamId: TEAM_A, providerRole: 'org:member', clinicalRole: null }],
    });
    expect(JSON.stringify(doc)).not.toMatch(/alicia\.gomez|573001234567/);

    await api('bob').get(`/teams/${TEAM_A}/staff`).expect(403);
    expect((await api('bob').get(`/teams/${TEAM_B}/staff`).expect(200)).body).toEqual([]);
  });

  it('ignores a late webhook older than the stored data', async () => {
    await send(user('alice', 'Alicia', 'a@clinica.co', 2000)).expect(200);
    await send(user('alice', 'Vieja', 'a@clinica.co', 1000)).expect(200);
    await send(membership('organizationMembership.created', TEAM_A, 'alice')).expect(200);

    const [member] = (await api('alice').get(`/teams/${TEAM_A}/staff`)).body;
    expect(member.displayName).toBe('Alicia Gómez');
  });

  it('shows names in the timeline and anonymizes deleted users everywhere', async () => {
    await send(user('alice', 'Alicia', 'a@clinica.co', 1000)).expect(200);
    await send(user('carol', 'Carolina', 'c@clinica.co', 1000)).expect(200);
    await send(membership('organizationMembership.created', TEAM_A, 'carol')).expect(200);

    const patients = `/teams/${TEAM_A}/patients`;
    const { body: patient } = await api('alice')
      .post(patients, {
        document: { type: 'CC', number: '1000123456' },
        name: { firstName: 'Andrés', firstLastName: 'Gómez' },
        birthDate: '1990-05-20',
        sex: 'H',
        contact: { email: 'andres@example.com' },
        affiliation: { eps: 'Sanitas', regime: 'contributivo' },
        requestedBy: 'carol',
      })
      .expect(201);
    await t.relay.flush();

    const timeline = `${patients}/${patient.id}/timeline`;
    expect((await api('alice').get(timeline).expect(200)).body[0]).toMatchObject({
      requestedBy: 'carol',
      requestedByName: 'Carolina Gómez',
      executedBy: 'alice',
      executedByName: 'Alicia Gómez',
    });

    await send({ type: 'user.deleted', data: { id: 'carol', deleted: true } }).expect(200);

    expect((await api('alice').get(timeline).expect(200)).body[0]).toMatchObject({
      requestedBy: 'carol',
      requestedByName: 'Usuario eliminado',
    });
    expect((await api('alice').get(`/teams/${TEAM_A}/staff`)).body).toEqual([]);
    const [row] = (
      await t.db.execute(sql`select display_name, email_masked from staff_users where user_id = 'carol'`)
    ).rows;
    expect(row).toEqual({ display_name: null, email_masked: null });
    expect(
      await t.mongo.collection(STAFF_COLLECTION).findOne({ _id: 'carol' as never }),
    ).toMatchObject({ displayName: null, emailMasked: null, deleted: true, teams: [] });

    // A stale update after the deletion does not bring the data back.
    await send(user('carol', 'Carolina', 'c@clinica.co', 9_999_999_999_999)).expect(200);
    expect((await api('alice').get(timeline)).body[0].requestedByName).toBe(
      'Usuario eliminado',
    );
  });
});
