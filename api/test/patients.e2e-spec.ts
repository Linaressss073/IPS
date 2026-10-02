import { sql } from 'drizzle-orm';
import { TeamId } from '../src/shared/domain/index.js';
import { TIMELINE_COLLECTION } from '../src/shared/infrastructure/persistence/mongo.js';
import { PostgresPatientTimelineReader } from '../src/contexts/patients/infrastructure/read-models/postgres-patient-timeline.reader.js';
import { createTestApp, TEAM_A, TEAM_B } from './support/test-app.js';

describe('Patients API (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  const api = (token?: string) => t.api(token);
  const patientsA = `/teams/${TEAM_A}/patients`;

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.db.execute(
      sql`truncate table patients_patients, shared_trace_events`,
    );
    await t.mongo.collection(TIMELINE_COLLECTION).deleteMany({});
  });

  afterAll(async () => {
    await t?.app.close();
  });

  const patient = {
    document: { type: 'CC', number: '1.000.123.456' },
    name: {
      firstName: 'José',
      middleName: 'Alejandro',
      firstLastName: 'Peña',
      secondLastName: 'Gómez',
    },
    birthDate: '1990-05-20',
    sex: 'H',
    contact: { email: 'Jose.Pena@example.com', phone: '300 123 4567' },
    affiliation: { eps: 'Sanitas', regime: 'contributivo' },
  };

  const registerAs = (token: string, body: object = patient) =>
    api(token).post(patientsA, body);

  it('rejects requests without a valid token or from another team', async () => {
    await api().get(patientsA).expect(401);
    const res = await api('bob').get(patientsA).expect(403);
    expect(res.body.code).toBe('NOT_A_TEAM_MEMBER');
  });

  it('trusts the team selected in the signed token without asking the provider', async () => {
    await api('dana').get(patientsA).expect(200);
    await api('dana').get(`/teams/${TEAM_B}/patients`).expect(403);
  });

  it('registers a patient with normalized data', async () => {
    const res = await registerAs('alice').expect(201);
    expect(res.body).toMatchObject({
      document: { type: 'CC', number: '1000123456' },
      fullName: 'José Alejandro Peña Gómez',
      contact: {
        email: 'jose.pena@example.com',
        phone: '3001234567',
        address: null,
      },
      affiliation: { eps: 'Sanitas', regime: 'contributivo' },
      version: 1,
    });

    const fetched = await api('alice')
      .get(`${patientsA}/${res.body.id}`)
      .expect(200);
    expect(fetched.body).toEqual(res.body);
  });

  it('registers each document once per team', async () => {
    await registerAs('alice').expect(201);
    const res = await registerAs('alice', {
      ...patient,
      document: { type: 'cc', number: '1000123456' },
    }).expect(409);
    expect(res.body.code).toBe('DOCUMENT_ALREADY_REGISTERED');

    await api('bob').post(`/teams/${TEAM_B}/patients`, patient).expect(201);
  });

  it('validates shape and business rules', async () => {
    const invalid = async (body: object) =>
      (await registerAs('alice', body).expect(400)).body;

    expect(
      await invalid({ ...patient, document: { type: 'DNI', number: '123' } }),
    ).toMatchObject({ code: 'INVALID_VALUE' });
    expect(
      await invalid({
        ...patient,
        affiliation: { eps: 'Sanitas', regime: 'particular' },
      }),
    ).toMatchObject({ code: 'INVALID_VALUE' });
    expect(
      await invalid({ ...patient, birthDate: '2999-01-01' }),
    ).toMatchObject({ code: 'INVALID_BIRTH_DATE' });
    // Shape errors from the ValidationPipe: missing e-mail, unknown field.
    await invalid({ ...patient, contact: { phone: '3001234567' } });
    await invalid({ ...patient, extra: 'field' });
  });

  it('searches by document or name, ignoring accents, and paginates', async () => {
    await registerAs('alice').expect(201);
    await registerAs('alice', {
      ...patient,
      document: { type: 'TI', number: '1099888777' },
      name: { firstName: 'Ana', firstLastName: 'Peña' },
    }).expect(201);
    await api('bob').post(`/teams/${TEAM_B}/patients`, patient).expect(201);

    const search = async (query: string) =>
      (await api('alice').get(`${patientsA}?${query}`).expect(200)).body;

    expect((await search('q=pena')).total).toBe(2);
    expect((await search('q=jose pena')).items).toEqual([
      expect.objectContaining({ fullName: 'José Alejandro Peña Gómez' }),
    ]);
    expect((await search('q=1099888')).items[0].document.type).toBe('TI');
    expect(await search('pageSize=1&page=2')).toMatchObject({
      total: 2,
      page: 2,
      pageSize: 1,
      items: [expect.objectContaining({ fullName: 'José Alejandro Peña Gómez' })],
    });
    expect((await search('q=%25')).total).toBe(0);
  });

  it('updates with optimistic locking', async () => {
    const { body } = await registerAs('alice').expect(201);
    const url = `${patientsA}/${body.id}`;
    const address = { ...patient.contact, address: 'Calle 1 # 2-3' };

    const updated = await api('alice')
      .patch(url, { version: 1, contact: address })
      .expect(200);
    expect(updated.body).toMatchObject({
      version: 2,
      contact: { address: 'Calle 1 # 2-3' },
    });

    const stale = await api('alice')
      .patch(url, { version: 1, sex: 'M' })
      .expect(409);
    expect(stale.body.code).toBe('PATIENT_VERSION_CONFLICT');
  });

  it('lets only one of two simultaneous updates win', async () => {
    const { body } = await registerAs('alice').expect(201);
    const url = `${patientsA}/${body.id}`;

    const results = await Promise.all([
      api('alice').patch(url, { version: 1, sex: 'M' }),
      api('alice').patch(url, { version: 1, sex: 'I' }),
    ]);
    expect(results.map((r) => r.status).sort((a, b) => a - b)).toEqual([
      200, 409,
    ]);

    const final = await api('alice').get(url).expect(200);
    expect(final.body.version).toBe(2);
  });

  it('accepts a requester of the same team only', async () => {
    const { body } = await registerAs('alice').expect(201);
    const url = `${patientsA}/${body.id}`;

    const res = await api('alice')
      .patch(url, { version: 1, sex: 'M', requestedBy: 'bob' })
      .expect(400);
    expect(res.body.code).toBe('INVALID_REQUESTER');
    await api('alice')
      .patch(url, { version: 1, sex: 'M', requestedBy: 'carol' })
      .expect(200);
  });

  it('builds the timeline in Mongo from the Postgres trace events', async () => {
    const { body } = await api('alice')
      .post(patientsA, { ...patient, requestedBy: 'carol' })
      .expect(201);
    const url = `${patientsA}/${body.id}`;
    await api('alice')
      .patch(url, { version: 1, contact: { email: 'new@example.com' } })
      .expect(200);

    // Mongo is a read model: nothing there until the relay runs.
    expect((await api('alice').get(`${url}/timeline`).expect(200)).body).toEqual(
      [],
    );
    expect(await t.relay.flush()).toBe(2);
    expect(await t.relay.flush()).toBe(0);

    const timeline = (await api('alice').get(`${url}/timeline`).expect(200))
      .body;
    expect(timeline).toEqual([
      expect.objectContaining({
        type: 'patient.registered',
        requestedBy: 'carol',
        executedBy: 'alice',
      }),
      expect.objectContaining({
        type: 'patient.updated',
        requestedBy: 'alice',
        executedBy: 'alice',
        data: {
          changes: [
            expect.objectContaining({
              field: 'contact',
              to: { email: 'new@example.com', phone: null, address: null },
            }),
          ],
        },
      }),
    ]);

    // Both engines answer the same timeline.
    const postgres = t.app.get(PostgresPatientTimelineReader);
    expect(await postgres.forPatient(TeamId.of(TEAM_A), body.id)).toEqual(
      timeline,
    );
  });

  it('hides patients and timelines of other teams', async () => {
    const { body } = await registerAs('alice').expect(201);
    await api('bob').get(`/teams/${TEAM_B}/patients/${body.id}`).expect(404);
    await api('bob')
      .get(`/teams/${TEAM_B}/patients/${body.id}/timeline`)
      .expect(404);
    await api('alice').get(`${patientsA}/not-a-uuid`).expect(400);
  });

  describe('companions', () => {
    const maria = {
      relationship: 'madre',
      name: { firstName: 'María', firstLastName: 'Torres' },
      document: { type: 'CC', number: '52.000.111' },
      phone: '300 111 2222',
    };

    it('keeps a numbered history, most recent first, in both engines', async () => {
      const { body } = await api('alice')
        .post(patientsA, { ...patient, companion: maria })
        .expect(201);
      const url = `${patientsA}/${body.id}/companions`;

      const second = await api('alice')
        .post(url, { phone: '3003334444', relationship: 'cuidador', requestedBy: 'carol' })
        .expect(201);
      expect(second.body).toMatchObject({
        number: 2,
        phone: '3003334444',
        requestedBy: 'carol',
        executedBy: 'alice',
      });

      // Two companions at the same time still get distinct numbers.
      const concurrent = await Promise.all([
        api('alice').post(url, { phone: '3005555555' }),
        api('alice').post(url, { phone: '3006666666' }),
      ]);
      expect(
        concurrent.map((r) => r.body.number).sort((a, b) => a - b),
      ).toEqual([3, 4]);

      await t.relay.flush();
      const { history } = (await api('alice').get(url).expect(200)).body;
      expect(history.map((c: { number: number }) => c.number)).toEqual([
        4, 3, 2, 1,
      ]);
      expect(history[3]).toMatchObject({
        number: 1,
        relationship: 'madre',
        fullName: 'María Torres',
        document: { type: 'CC', number: '52000111' },
        phone: '3001112222',
      });

      // The companions are trace events too, so they show in the timeline.
      const timeline = (
        await api('alice').get(`${patientsA}/${body.id}/timeline`).expect(200)
      ).body;
      expect(
        timeline.filter(
          (e: { type: string }) => e.type === 'patient.companion_recorded',
        ),
      ).toHaveLength(4);

      const postgres = t.app.get(PostgresPatientTimelineReader);
      expect(
        await postgres.forPatient(TeamId.of(TEAM_A), body.id, {
          type: 'patient.companion_recorded',
        }),
      ).toEqual(
        timeline.filter(
          (e: { type: string }) => e.type === 'patient.companion_recorded',
        ),
      );
    });

    it('requires a name or a phone and an existing patient of the team', async () => {
      const { body } = await registerAs('alice').expect(201);
      const url = `${patientsA}/${body.id}/companions`;

      const invalid = await api('alice')
        .post(url, { document: { type: 'CC', number: '52000111' } })
        .expect(400);
      expect(invalid.body.code).toBe('INVALID_VALUE');
      // An invalid companion on registration rolls back the whole patient.
      await registerAs('alice', {
        ...patient,
        document: { type: 'CC', number: '79000222' },
        companion: { relationship: 'madre' },
      }).expect(400);
      expect(
        (await api('alice').get(`${patientsA}?q=79000222`).expect(200)).body
          .total,
      ).toBe(0);

      await api('bob')
        .post(`/teams/${TEAM_B}/patients/${body.id}/companions`, {
          phone: '3001112222',
        })
        .expect(404);
      await api('bob')
        .get(`/teams/${TEAM_B}/patients/${body.id}/companions`)
        .expect(404);
    });
  });
});
