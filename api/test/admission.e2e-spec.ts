import { AdvanceAnnouncements } from '../src/contexts/admission/application/commands/admission.commands.js';
import {
  CALL_SETTINGS_COLLECTION,
  TURN_COUNTERS_COLLECTION,
  TURNS_COLLECTION,
} from '../src/contexts/admission/infrastructure/persistence/mongo-admission.js';
import { PATIENTS_COLLECTION } from '../src/contexts/patients/infrastructure/persistence/patient.document.js';
import { APPOINTMENTS_COLLECTION } from '../src/contexts/scheduling/infrastructure/persistence/scheduling.documents.js';
import { STAFF_COLLECTION } from '../src/contexts/staff/infrastructure/persistence/staff.document.js';
import { colombiaDate, colombiaInstant } from '../src/shared/domain/index.js';
import { TRACE_EVENTS_COLLECTION } from '../src/shared/infrastructure/persistence/mongo.js';
import { createTestApp, TEAM_A } from './support/test-app.js';

describe('Admission and turns (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  const api = (token?: string) => t.api(token);
  const team = `/teams/${TEAM_A}`;
  const today = colombiaDate(new Date());

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.wipe(
      TURNS_COLLECTION,
      TURN_COUNTERS_COLLECTION,
      CALL_SETTINGS_COLLECTION,
      APPOINTMENTS_COLLECTION,
      PATIENTS_COLLECTION,
      STAFF_COLLECTION,
      TRACE_EVENTS_COLLECTION,
    );
    // alice: admin + admisión (checks in and calls); carol: médico (calls, cannot check in).
    await api('alice').put(`${team}/staff/alice/roles`, { roles: ['admision'] }).expect(200);
    await api('alice').put(`${team}/staff/carol/roles`, { roles: ['medico'] }).expect(200);
  });

  afterAll(async () => {
    await t?.app.close();
  });

  const registerPatient = async (number: string, firstName: string) =>
    (
      await api('alice')
        .post(`${team}/patients`, {
          document: { type: 'CC', number },
          name: { firstName, firstLastName: 'Gómez', secondLastName: 'Ruiz' },
          birthDate: '1990-05-20',
          sex: 'H',
          contact: { email: `${number}@example.com` },
          affiliation: { eps: 'Sanitas', regime: 'contributivo' },
        })
        .expect(201)
    ).body.id as string;

  /** An appointment as Scheduling stores it (setup only; booking is tested there). */
  const appointment = async (patientId: string, options: { date?: string; status?: string; minute?: number } = {}) => {
    const id = crypto.randomUUID();
    const date = options.date ?? today;
    const minute = options.minute ?? 7 * 60;
    await t.mongo.collection(APPOINTMENTS_COLLECTION).insertOne({
      _id: id as never,
      teamId: TEAM_A,
      patientId,
      agendaId: crypto.randomUUID(),
      professionalId: 'carol',
      service: { id: crypto.randomUUID(), code: 'RTH', name: 'Rehabilitación' },
      location: { id: crypto.randomUUID(), label: 'Consultorio 502' },
      date,
      startMinute: minute,
      endMinute: minute + 20,
      startsAt: colombiaInstant(date, minute),
      status: options.status ?? 'confirmada',
      active: options.status !== 'cancelada',
      cancelReason: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  };

  const checkIn = (appointmentId: string) => api('alice').post(`${team}/turns`, { appointmentId });

  it('gives each arrival the next turn of the service, once per appointment', async () => {
    const andres = await registerPatient('1000123456', 'Andrés');
    const maria = await registerPatient('52000111', 'María');
    const first = (await checkIn(await appointment(andres)).expect(201)).body;
    expect(first).toMatchObject({
      label: 'RTH 1',
      status: 'en_espera',
      calls: 0,
      patient: { id: andres, shortName: 'Andrés Gómez' },
      professional: { userId: 'carol' },
      location: { label: 'Consultorio 502' },
      appointment: { time: '07:00' },
    });

    // Two receptionists checking in the same appointment at once: one turn.
    const second = await appointment(maria, { minute: 7 * 60 + 20 });
    const results = await Promise.all([checkIn(second), checkIn(second)]);
    expect(results.map((r) => r.status).sort((a, b) => a - b)).toEqual([201, 409]);
    expect(results.find((r) => r.status === 409)!.body.code).toBe('ALREADY_CHECKED_IN');
    expect(results.find((r) => r.status === 201)!.body.label).toBe('RTH 2');

    const tomorrow = colombiaDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    expect((await checkIn(await appointment(andres, { date: tomorrow })).expect(400)).body.code).toBe(
      'APPOINTMENT_NOT_TODAY',
    );
    expect((await checkIn(await appointment(andres, { status: 'cancelada', minute: 600 })).expect(409)).body.code).toBe(
      'APPOINTMENT_NOT_ADMISSIBLE',
    );
    expect((await checkIn(crypto.randomUUID()).expect(404)).body.code).toBe('APPOINTMENT_NOT_FOUND');
  });

  it('calls on the screen, re-announces every interval and closes a no-show', async () => {
    const andres = await registerPatient('1000123456', 'Andrés');
    const turn = (await checkIn(await appointment(andres)).expect(201)).body;

    // A médico calls from the consultorio.
    const called = (await api('carol').post(`${team}/turns/${turn.id}/call`, { version: 1 }).expect(200)).body;
    expect(called).toMatchObject({ status: 'anunciado', calls: 1, version: 2 });
    expect((await api('carol').post(`${team}/turns/${turn.id}/call`, { version: 1 }).expect(409)).body.code).toBe(
      'TURN_VERSION_CONFLICT',
    );

    const board = (await api('carol').get(`${team}/turns/board`).expect(200)).body;
    expect(board).toEqual({
      current: expect.objectContaining({
        label: 'RTH 1',
        location: 'Consultorio 502',
        patientName: 'Andrés Gómez',
        calls: 1,
      }),
      recent: [],
      settings: { announceIntervalSeconds: 120, maxCalls: 3 },
    });
    // Only the turn, the place and the name: no document on the screen.
    expect(JSON.stringify(board)).not.toContain('1000123456');

    // Two more automatic calls, then "no se presentó".
    const advance = t.app.get(AdvanceAnnouncements);
    const at = (seconds: number) => new Date(Date.parse(called.lastCalledAt) + seconds * 1000);
    expect(await advance.execute(at(60))).toEqual({ reannounced: 0, noShows: 0 });
    expect(await advance.execute(at(121))).toEqual({ reannounced: 1, noShows: 0 });
    expect(await advance.execute(at(242))).toEqual({ reannounced: 1, noShows: 0 });
    expect(await advance.execute(at(363))).toEqual({ reannounced: 0, noShows: 1 });

    const [closed] = (await api('alice').get(`${team}/turns`).expect(200)).body;
    expect(closed).toMatchObject({ status: 'no_se_presento', calls: 3 });
    expect((await api('carol').get(`${team}/turns/board`)).body).toMatchObject({
      current: null,
      recent: [expect.objectContaining({ label: 'RTH 1', status: 'no_se_presento' })],
    });

    const timeline = (await api('alice').get(`${team}/patients/${andres}/timeline`).expect(200)).body;
    expect(timeline.map((e: { type: string }) => e.type)).toEqual([
      'patient.registered',
      'turn.checked_in',
      'turn.called',
      'turn.called',
      'turn.called',
      'turn.no_show',
    ]);
    expect(timeline[3]).toMatchObject({ executedBy: 'system', data: { automatic: true, calls: 2 } });
  });

  it('attends, follows the IPS settings and enforces the roles', async () => {
    const andres = await registerPatient('1000123456', 'Andrés');
    const turn = (await checkIn(await appointment(andres)).expect(201)).body;

    // The professional receives the patient: the turn is closed.
    const attended = (await api('carol').post(`${team}/turns/${turn.id}/attend`, { version: 1 }).expect(200)).body;
    expect(attended).toMatchObject({ status: 'atendido' });
    expect((await api('carol').post(`${team}/turns/${turn.id}/call`, { version: 2 }).expect(409)).body.code).toBe(
      'INVALID_TURN_TRANSITION',
    );

    // Settings: administrators only, within limits.
    expect((await api('alice').put(`${team}/admission/settings`, { announceIntervalSeconds: 5, maxCalls: 3 }).expect(400)).body.code).toBe(
      'INVALID_VALUE',
    );
    await api('carol').put(`${team}/admission/settings`, { announceIntervalSeconds: 60, maxCalls: 2 }).expect(403);
    expect(
      (await api('alice').put(`${team}/admission/settings`, { announceIntervalSeconds: 60, maxCalls: 2 }).expect(200)).body,
    ).toEqual({ announceIntervalSeconds: 60, maxCalls: 2 });
    expect((await api('carol').get(`${team}/admission/settings`).expect(200)).body.maxCalls).toBe(2);

    // A médico calls turns but does not check patients in.
    const other = await appointment(andres, { minute: 9 * 60 });
    expect((await api('carol').post(`${team}/turns`, { appointmentId: other }).expect(403)).body.code).toBe(
      'PERMISSION_DENIED',
    );
    expect((await api('carol').get(`${team}/turns?status=atendido`).expect(200)).body).toHaveLength(1);
  });
});
