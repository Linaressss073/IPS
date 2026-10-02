import { PATIENTS_COLLECTION } from '../src/contexts/patients/infrastructure/persistence/patient.document.js';
import {
  AGENDAS_COLLECTION,
  APPOINTMENTS_COLLECTION,
  LOCATIONS_COLLECTION,
  SERVICES_COLLECTION,
} from '../src/contexts/scheduling/infrastructure/persistence/scheduling.documents.js';
import { colombiaDate } from '../src/contexts/scheduling/domain/utils/colombia-time.js';
import { STAFF_COLLECTION } from '../src/contexts/staff/infrastructure/persistence/staff.document.js';
import { TRACE_EVENTS_COLLECTION } from '../src/shared/infrastructure/persistence/mongo.js';
import { createTestApp, TEAM_A } from './support/test-app.js';

describe('Scheduling API (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  const api = (token?: string) => t.api(token);
  const team = `/teams/${TEAM_A}`;
  // A week ahead in Colombia, so every slot is in the future.
  const day = colombiaDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.wipe(
      SERVICES_COLLECTION,
      LOCATIONS_COLLECTION,
      AGENDAS_COLLECTION,
      APPOINTMENTS_COLLECTION,
      PATIENTS_COLLECTION,
      STAFF_COLLECTION,
      TRACE_EVENTS_COLLECTION,
    );
  });

  afterAll(async () => {
    await t?.app.close();
  });

  const registerPatient = async (number: string, firstName: string) =>
    (
      await api('alice')
        .post(`${team}/patients`, {
          document: { type: 'CC', number },
          name: { firstName, firstLastName: 'Gómez' },
          birthDate: '1990-05-20',
          sex: 'H',
          contact: { email: `${number}@example.com` },
          affiliation: { eps: 'Sanitas', regime: 'contributivo' },
        })
        .expect(201)
    ).body.id as string;

  /** Service RTH, Consultorio 502 and carol as "medico" with a 07:00-08:00 agenda. */
  const setUp = async () => {
    const service = (
      await api('alice').post(`${team}/services`, { code: 'rth', name: 'Rehabilitación' }).expect(201)
    ).body;
    const location = (
      await api('alice').post(`${team}/locations`, { kind: 'consultorio', number: '502' }).expect(201)
    ).body;
    await api('alice').put(`${team}/staff/carol/roles`, { roles: ['medico'] }).expect(200);
    const agenda = (
      await api('alice')
        .post(`${team}/agendas`, {
          professionalId: 'carol',
          serviceId: service.id,
          locationId: location.id,
          date: day,
          startTime: '07:00',
          endTime: '08:00',
          slotMinutes: 20,
        })
        .expect(201)
    ).body;
    return { service, location, agendaId: agenda.id as string };
  };

  it('configures services, locations and professionals', async () => {
    const { service, location } = await setUp();
    expect(service).toMatchObject({ code: 'RTH', name: 'Rehabilitación', active: true });
    expect(location).toMatchObject({ label: 'Consultorio 502', active: true });

    const takenCode = await api('alice').post(`${team}/services`, { code: 'RTH', name: 'Otro' }).expect(409);
    expect(takenCode.body.code).toBe('SERVICE_CODE_TAKEN');
    const takenPlace = await api('alice')
      .post(`${team}/locations`, { kind: 'Consultorio', number: '502' })
      .expect(409);
    expect(takenPlace.body.code).toBe('LOCATION_TAKEN');

    expect((await api('alice').get(`${team}/professionals`).expect(200)).body).toEqual([
      { userId: 'carol', displayName: null },
    ]);
    // Only administrators configure; a "medico" can read.
    await api('carol').get(`${team}/services`).expect(200);
    const denied = await api('carol').post(`${team}/services`, { code: 'MG', name: 'Medicina' }).expect(403);
    expect(denied.body.code).toBe('PERMISSION_DENIED');
  });

  it('lists professionals even with staff documents from before roles existed', async () => {
    await t.mongo.collection(STAFF_COLLECTION).insertOne({
      _id: 'legacy' as never,
      displayName: 'Persona Antigua',
      emailMasked: null,
      deleted: false,
      deletedAt: null,
      teams: [{ teamId: TEAM_A, providerRole: 'org:member', clinicalRole: null }],
      sourceUpdatedAt: new Date(0),
    });
    await api('alice').put(`${team}/staff/carol/roles`, { roles: ['medico'] }).expect(200);
    expect((await api('alice').get(`${team}/professionals`).expect(200)).body).toEqual([
      { userId: 'carol', displayName: null },
    ]);
    expect((await api('alice').get(`${team}/staff`).expect(200)).body).toContainEqual(
      expect.objectContaining({ userId: 'legacy', roles: [] }),
    );
  });

  it('validates agendas: professional role, whole slots and no overlaps', async () => {
    const { service, location } = await setUp();
    const agenda = {
      professionalId: 'carol',
      serviceId: service.id,
      locationId: location.id,
      date: day,
      startTime: '07:30',
      endTime: '09:00',
      slotMinutes: 30,
    };
    expect((await api('alice').post(`${team}/agendas`, { ...agenda, professionalId: 'alice' }).expect(400)).body.code)
      .toBe('NOT_A_PROFESSIONAL');
    expect((await api('alice').post(`${team}/agendas`, { ...agenda, endTime: '08:50' }).expect(400)).body.code)
      .toBe('INVALID_AGENDA');
    expect((await api('alice').post(`${team}/agendas`, agenda).expect(409)).body.code).toBe('AGENDA_OVERLAP');
    await api('alice').post(`${team}/agendas`, { ...agenda, startTime: '08:00' }).expect(201);
  });

  it('books, confirms, moves and cancels an appointment, traced in the timeline', async () => {
    const { agendaId } = await setUp();
    const andres = await registerPatient('1000123456', 'Andrés');
    const appointments = `${team}/appointments`;

    const booked = (
      await api('alice').post(appointments, { patientId: andres, agendaId, time: '07:20' }).expect(201)
    ).body;
    expect(booked).toMatchObject({
      status: 'agendada',
      patient: { id: andres, fullName: 'Andrés Gómez', document: { type: 'CC', number: '1000123456' } },
      professional: { userId: 'carol' },
      service: { code: 'RTH', name: 'Rehabilitación' },
      location: { label: 'Consultorio 502' },
      date: day,
      time: '07:20',
      endTime: '07:40',
      version: 1,
    });

    const [agenda] = (await api('carol').get(`${team}/agendas?date=${day}`).expect(200)).body;
    expect(agenda.slots.map((s: { time: string; appointment: unknown }) => [s.time, !!s.appointment])).toEqual([
      ['07:00', false],
      ['07:20', true],
      ['07:40', false],
    ]);
    expect(agenda.slots[1].appointment.patient.fullName).toBe('Andrés Gómez');

    const url = `${appointments}/${booked.id}`;
    const confirmed = (await api('alice').post(`${url}/confirm`, { version: 1 }).expect(200)).body;
    expect(confirmed).toMatchObject({ status: 'confirmada', version: 2 });
    expect((await api('alice').post(`${url}/confirm`, { version: 1 }).expect(409)).body.code).toBe(
      'APPOINTMENT_VERSION_CONFLICT',
    );

    const moved = (
      await api('alice').post(`${url}/reschedule`, { version: 2, agendaId, time: '07:40' }).expect(200)
    ).body;
    expect(moved).toMatchObject({ status: 'agendada', time: '07:40', version: 3 });

    const cancelled = (
      await api('alice').post(`${url}/cancel`, { version: 3, reason: 'Viaja fuera de la ciudad' }).expect(200)
    ).body;
    expect(cancelled).toMatchObject({ status: 'cancelada', cancelReason: 'Viaja fuera de la ciudad' });
    expect((await api('alice').post(`${url}/confirm`, { version: 4 }).expect(409)).body.code).toBe(
      'INVALID_APPOINTMENT_TRANSITION',
    );

    // The freed slot can be booked again.
    const maria = await registerPatient('52000111', 'María');
    await api('alice').post(appointments, { patientId: maria, agendaId, time: '07:40' }).expect(201);

    const timeline = (await api('alice').get(`${team}/patients/${andres}/timeline`).expect(200)).body;
    expect(timeline.map((e: { type: string }) => e.type)).toEqual([
      'patient.registered',
      'appointment.scheduled',
      'appointment.confirmed',
      'appointment.rescheduled',
      'appointment.cancelled',
    ]);
    expect(timeline[3].data).toMatchObject({ time: '07:40', from: { time: '07:20' } });
    expect(timeline[4].data).toMatchObject({ reason: 'Viaja fuera de la ciudad' });

    const ofDay = (await api('carol').get(`${appointments}?date=${day}`).expect(200)).body;
    expect(ofDay.map((a: { status: string }) => a.status)).toEqual(['cancelada', 'agendada']);
  });

  it('never gives one slot to two patients, nor one patient two places at once', async () => {
    const { service, agendaId } = await setUp();
    const [andres, maria] = await Promise.all([
      registerPatient('1000123456', 'Andrés'),
      registerPatient('52000111', 'María'),
    ]);

    const results = await Promise.all(
      [andres, maria].map((patientId) =>
        api('alice').post(`${team}/appointments`, { patientId, agendaId, time: '07:00' }),
      ),
    );
    expect(results.map((r) => r.status).sort((a, b) => a - b)).toEqual([201, 409]);
    expect(results.find((r) => r.status === 409)!.body.code).toBe('SLOT_TAKEN');

    // Same time with another professional in another place: still one patient.
    const winner = results.find((r) => r.status === 201)!.body.patient.id;
    const room = (await api('alice').post(`${team}/locations`, { kind: 'Consultorio', number: '503' })).body;
    await api('alice').put(`${team}/staff/alice/roles`, { roles: ['medico'] }).expect(200);
    const second = (
      await api('alice')
        .post(`${team}/agendas`, {
          professionalId: 'alice',
          serviceId: service.id,
          locationId: room.id,
          date: day,
          startTime: '07:00',
          endTime: '07:20',
          slotMinutes: 20,
        })
        .expect(201)
    ).body;
    const clash = await api('alice')
      .post(`${team}/appointments`, { patientId: winner, agendaId: second.id, time: '07:00' })
      .expect(409);
    expect(clash.body.code).toBe('PATIENT_ALREADY_BOOKED');

    // An agenda with appointments cannot be deleted; an empty one can.
    expect((await api('alice').delete(`${team}/agendas/${agendaId}`).expect(409)).body.code).toBe(
      'AGENDA_HAS_APPOINTMENTS',
    );
    await api('alice').delete(`${team}/agendas/${second.id}`).expect(204);
  });

  it('lets professionals read appointments but not book them', async () => {
    const { agendaId } = await setUp();
    const andres = await registerPatient('1000123456', 'Andrés');
    const denied = await api('carol')
      .post(`${team}/appointments`, { patientId: andres, agendaId, time: '07:00' })
      .expect(403);
    expect(denied.body.code).toBe('PERMISSION_DENIED');
    await api('carol').get(`${team}/appointments?patientId=${andres}`).expect(200);
    expect((await api('carol').get(`${team}/appointments`).expect(400)).body.code).toBe('INVALID_VALUE');
    expect(
      (await api('alice').post(`${team}/appointments`, { patientId: crypto.randomUUID(), agendaId, time: '07:00' }).expect(404))
        .body.code,
    ).toBe('PATIENT_NOT_FOUND');
  });
});
