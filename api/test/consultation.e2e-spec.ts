import { CONSULTATIONS_COLLECTION } from '../src/contexts/consultation/infrastructure/persistence/mongo-consultation.js';
import { PATIENTS_COLLECTION } from '../src/contexts/patients/infrastructure/persistence/patient.document.js';
import { APPOINTMENTS_COLLECTION } from '../src/contexts/scheduling/infrastructure/persistence/scheduling.documents.js';
import { STAFF_COLLECTION } from '../src/contexts/staff/infrastructure/persistence/staff.document.js';
import { colombiaDate, colombiaInstant } from '../src/shared/domain/index.js';
import { TRACE_EVENTS_COLLECTION } from '../src/shared/infrastructure/persistence/mongo.js';
import { createTestApp, TEAM_A } from './support/test-app.js';

describe('Consultation / clinical record (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  const api = (token?: string) => t.api(token);
  const team = `/teams/${TEAM_A}`;
  const consultations = `${team}/consultations`;
  const today = colombiaDate(new Date());

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.wipe(CONSULTATIONS_COLLECTION, APPOINTMENTS_COLLECTION, PATIENTS_COLLECTION, STAFF_COLLECTION, TRACE_EVENTS_COLLECTION);
    // carol: the physician of the appointments. alice: admin (no clinical access by default).
    await api('alice').put(`${team}/staff/carol/roles`, { roles: ['medico'] }).expect(200);
  });

  afterAll(async () => {
    await t?.app.close();
  });

  const setUp = async () => {
    const patientId = (
      await api('alice')
        .post(`${team}/patients`, {
          document: { type: 'CC', number: '1000123456' },
          name: { firstName: 'Andrés', firstLastName: 'Gómez' },
          birthDate: '1990-05-20',
          sex: 'H',
          contact: { email: 'andres@example.com' },
          affiliation: { eps: 'Sanitas', regime: 'contributivo' },
        })
        .expect(201)
    ).body.id as string;
    const appointmentId = crypto.randomUUID();
    await t.mongo.collection(APPOINTMENTS_COLLECTION).insertOne({
      _id: appointmentId as never,
      teamId: TEAM_A,
      patientId,
      agendaId: crypto.randomUUID(),
      professionalId: 'carol',
      service: { id: crypto.randomUUID(), code: 'MG', name: 'Medicina general' },
      location: { id: crypto.randomUUID(), label: 'Consultorio 301' },
      date: today,
      startMinute: 420,
      endMinute: 440,
      startsAt: colombiaInstant(today, 420),
      status: 'confirmada',
      active: true,
      cancelReason: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { patientId, appointmentId };
  };

  const draft = {
    note: {
      reason: 'Fiebre y tos',
      currentIllness: 'Tres días de fiebre de hasta 38.5 °C y tos seca.',
      physicalExam: 'Faringe eritematosa, sin exudado.',
      plan: 'Manejo sintomático; consultar si hay dificultad respiratoria.',
    },
    vitals: [
      { name: 'temperatura', value: 38.2 },
      { name: 'peso', value: 70 },
      { name: 'talla', value: 175 },
    ],
    diagnoses: [{ code: 'J06.9', description: 'Infección aguda de las vías respiratorias superiores', principal: true }],
    prescription: [
      {
        medication: 'Acetaminofén 500 mg',
        presentation: 'Tableta',
        dose: '1 tableta',
        route: 'oral',
        frequency: 'Cada 8 horas',
        durationDays: 5,
        quantity: 15,
        instructions: '',
      },
    ],
  };

  it('is written, signed and frozen by the physician of the appointment', async () => {
    const { patientId, appointmentId } = await setUp();

    const started = (await api('carol').post(consultations, { appointmentId }).expect(200)).body;
    expect(started).toMatchObject({
      status: 'en_curso',
      signature: { signed: false },
      patient: { id: patientId, fullName: 'Andrés Gómez' },
      physician: { userId: 'carol' },
      service: { code: 'MG' },
      version: 1,
    });
    // Starting again opens the same consultation.
    expect((await api('carol').post(consultations, { appointmentId }).expect(200)).body.id).toBe(started.id);

    const url = `${consultations}/${started.id}`;
    expect((await api('carol').post(`${url}/sign`, { version: 1 }).expect(400)).body.code).toBe('CONSULTATION_INCOMPLETE');

    const saved = (await api('carol').patch(url, { version: 1, ...draft }).expect(200)).body;
    expect(saved).toMatchObject({
      version: 2,
      vitals: [{ name: 'temperatura', value: 38.2, unit: '°C' }, { name: 'peso' }, { name: 'talla' }],
      bmi: [22.9],
      diagnoses: [{ code: 'J06.9', principal: true }],
      prescription: [{ medication: 'Acetaminofén 500 mg', quantity: 15 }],
    });
    expect((await api('carol').patch(url, { version: 2, vitals: [{ name: 'temperatura', value: 60 }] }).expect(400)).body.code).toBe(
      'INVALID_VALUE',
    );

    const signed = (await api('carol').post(`${url}/sign`, { version: 2 }).expect(200)).body;
    expect(signed).toMatchObject({ status: 'firmada', signature: { signed: true } });
    expect((await api('carol').patch(url, { version: 3, note: { ...draft.note, reason: 'Otro' } }).expect(409)).body.code).toBe(
      'CONSULTATION_SIGNED',
    );

    const amended = (await api('carol').post(`${url}/addenda`, { version: 3, text: 'Prueba rápida de influenza negativa.' }).expect(200))
      .body;
    expect(amended.addenda).toEqual([
      expect.objectContaining({ text: 'Prueba rápida de influenza negativa.', writtenBy: 'carol' }),
    ]);

    const history = (await api('carol').get(`${consultations}?patientId=${patientId}`).expect(200)).body;
    expect(history.map((c: { id: string }) => c.id)).toEqual([started.id]);
  });

  it('keeps the clinical record to physicians, and out of the shared timeline', async () => {
    const { patientId, appointmentId } = await setUp();
    const started = (await api('carol').post(consultations, { appointmentId }).expect(200)).body;
    await api('carol').patch(`${consultations}/${started.id}`, { version: 1, ...draft }).expect(200);
    await api('carol').post(`${consultations}/${started.id}/sign`, { version: 2 }).expect(200);

    // The administrator manages the IPS but does not read clinical records.
    expect((await api('alice').get(`${consultations}/${started.id}`).expect(403)).body.code).toBe('PERMISSION_DENIED');
    await api('alice').post(consultations, { appointmentId }).expect(403);

    // Another physician can read (continuity of care) but not write it.
    await api('alice').put(`${team}/staff/alice/roles`, { roles: ['medico'] }).expect(200);
    await api('alice').get(`${consultations}/${started.id}`).expect(200);
    expect((await api('alice').post(`${consultations}/${started.id}/addenda`, { version: 3, text: 'x' }).expect(403)).body.code).toBe(
      'NOT_THE_TREATING_PHYSICIAN',
    );

    // The timeline (seen by every role that reads patients) says what happened, not what was written.
    const timeline = (await api('alice').get(`${team}/patients/${patientId}/timeline`).expect(200)).body;
    expect(timeline.map((e: { type: string }) => e.type)).toEqual([
      'patient.registered',
      'consultation.started',
      'consultation.signed',
    ]);
    const shared = JSON.stringify(timeline);
    expect(shared).not.toMatch(/Fiebre|J06\.9|Acetaminof/);
  });
});
