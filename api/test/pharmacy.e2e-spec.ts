import {
  TURN_COUNTERS_COLLECTION,
  TURNS_COLLECTION,
} from '../src/contexts/admission/infrastructure/persistence/mongo-admission.js';
import { CONSULTATIONS_COLLECTION } from '../src/contexts/consultation/infrastructure/persistence/mongo-consultation.js';
import { PATIENTS_COLLECTION } from '../src/contexts/patients/infrastructure/persistence/patient.document.js';
import { DISPENSATIONS_COLLECTION } from '../src/contexts/pharmacy/infrastructure/persistence/mongo-dispensation.js';
import {
  APPOINTMENTS_COLLECTION,
  LOCATIONS_COLLECTION,
} from '../src/contexts/scheduling/infrastructure/persistence/scheduling.documents.js';
import { STAFF_COLLECTION } from '../src/contexts/staff/infrastructure/persistence/staff.document.js';
import { colombiaDate, colombiaInstant } from '../src/shared/domain/index.js';
import { TRACE_EVENTS_COLLECTION } from '../src/shared/infrastructure/persistence/mongo.js';
import { createTestApp, TEAM_A } from './support/test-app.js';

describe('Pharmacy (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  const api = (token?: string) => t.api(token);
  const team = `/teams/${TEAM_A}`;
  const pharmacy = `${team}/pharmacy/prescriptions`;
  const today = colombiaDate(new Date());

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.wipe(
      DISPENSATIONS_COLLECTION,
      CONSULTATIONS_COLLECTION,
      APPOINTMENTS_COLLECTION,
      LOCATIONS_COLLECTION,
      TURNS_COLLECTION,
      TURN_COUNTERS_COLLECTION,
      PATIENTS_COLLECTION,
      STAFF_COLLECTION,
      TRACE_EVENTS_COLLECTION,
    );
    // carol: the physician; alice: admin + farmacia.
    await api('alice').put(`${team}/staff/carol/roles`, { roles: ['medico'] }).expect(200);
    await api('alice').put(`${team}/staff/alice/roles`, { roles: ['farmacia'] }).expect(200);
  });

  afterAll(async () => {
    await t?.app.close();
  });

  /** A signed consultation with two medications (15 and 10 units). */
  const signedPrescription = async (sign = true) => {
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
    const consultation = (await api('carol').post(`${team}/consultations`, { appointmentId }).expect(200)).body;
    const item = { presentation: 'Tableta', dose: '1 tableta', route: 'oral', frequency: 'Cada 8 horas', durationDays: 5, instructions: '' };
    await api('carol')
      .patch(`${team}/consultations/${consultation.id}`, {
        version: 1,
        note: { reason: 'Fiebre y tos', currentIllness: 'Tres días de fiebre.', physicalExam: '', plan: '' },
        diagnoses: [{ code: 'J06.9', description: 'Infección respiratoria alta', principal: true }],
        prescription: [
          { ...item, medication: 'Acetaminofén 500 mg', quantity: 15 },
          { ...item, medication: 'Loratadina 10 mg', quantity: 10 },
        ],
      })
      .expect(200);
    if (sign) await api('carol').post(`${team}/consultations/${consultation.id}/sign`, { version: 2 }).expect(200);
    return { patientId, consultationId: consultation.id as string };
  };

  it('delivers in parts, never more than prescribed', async () => {
    const { consultationId } = await signedPrescription();

    const [listed] = (await api('alice').get(pharmacy).expect(200)).body;
    expect(listed).toMatchObject({
      consultationId,
      status: 'pendiente',
      patient: { fullName: 'Andrés Gómez' },
      physician: { userId: 'carol' },
      items: [
        { index: 0, medication: 'Acetaminofén 500 mg', prescribed: 15, delivered: 0, pending: 15 },
        { index: 1, medication: 'Loratadina 10 mg', prescribed: 10, delivered: 0, pending: 10 },
      ],
      version: 0,
    });
    // The pharmacy sees the prescription, never the clinical note or the diagnoses.
    expect(JSON.stringify(listed)).not.toMatch(/Fiebre|J06\.9|respiratoria/);

    const url = `${pharmacy}/${consultationId}/deliveries`;
    const partial = (
      await api('alice')
        .post(url, { version: 0, lines: [{ index: 0, quantity: 15 }, { index: 1, quantity: 4 }], note: 'Sin existencias de loratadina' })
        .expect(200)
    ).body;
    expect(partial).toMatchObject({ status: 'parcial', version: 1, items: [{ pending: 0 }, { delivered: 4, pending: 6 }] });
    expect(partial.deliveries[0]).toMatchObject({ by: 'alice', note: 'Sin existencias de loratadina' });

    expect((await api('alice').post(url, { version: 1, lines: [{ index: 1, quantity: 7 }] }).expect(400)).body.code).toBe('OVER_DELIVERY');
    expect((await api('alice').post(url, { version: 0, lines: [{ index: 1, quantity: 6 }] }).expect(409)).body.code).toBe(
      'DISPENSATION_VERSION_CONFLICT',
    );

    const complete = (await api('alice').post(url, { version: 1, lines: [{ index: 1, quantity: 6 }] }).expect(200)).body;
    expect(complete).toMatchObject({ status: 'completa', version: 2 });
    expect((await api('alice').post(url, { version: 2, lines: [{ index: 0, quantity: 1 }] }).expect(409)).body.code).toBe('NOTHING_PENDING');
    expect((await api('alice').get(`${pharmacy}?status=completa`).expect(200)).body).toHaveLength(1);
  });

  it('calls the patient with a FAR turn at a pharmacy window, on the shared screen', async () => {
    const { patientId, consultationId } = await signedPrescription();
    const window = (await api('alice').post(`${team}/locations`, { kind: 'Farmacia', number: '1' }).expect(201)).body;

    const turn = (await api('alice').post(`${pharmacy}/${consultationId}/turn`, { windowId: window.id }).expect(201)).body;
    expect(turn).toMatchObject({
      label: 'FAR 1',
      origin: { kind: 'farmacia', consultationId },
      status: 'en_espera',
      location: { label: 'Farmacia 1' },
      patient: { id: patientId },
    });
    expect((await api('alice').post(`${pharmacy}/${consultationId}/turn`, { windowId: window.id }).expect(409)).body.code).toBe(
      'ALREADY_CHECKED_IN',
    );
    expect((await api('alice').post(`${pharmacy}/${consultationId}/turn`, { windowId: crypto.randomUUID() }).expect(404)).body.code).toBe(
      'WINDOW_NOT_FOUND',
    );

    // Farmacia calls it like any turn: it shows on the waiting-room screen.
    await api('alice').post(`${team}/turns/${turn.id}/call`, { version: 1 }).expect(200);
    expect((await api('alice').get(`${team}/turns/board`).expect(200)).body.current).toMatchObject({
      label: 'FAR 1',
      location: 'Farmacia 1',
    });

    // Once everything is delivered, no more turns.
    await api('alice')
      .post(`${pharmacy}/${consultationId}/deliveries`, { version: 0, lines: [{ index: 0, quantity: 15 }, { index: 1, quantity: 10 }] })
      .expect(200);
    await t.mongo.collection(TURNS_COLLECTION).deleteMany({});
    expect((await api('alice').post(`${pharmacy}/${consultationId}/turn`, { windowId: window.id }).expect(409)).body.code).toBe(
      'ALREADY_DISPENSED',
    );

    // The shared timeline counts units; it names no medication.
    const timeline = (await api('alice').get(`${team}/patients/${patientId}/timeline`).expect(200)).body;
    const delivered = timeline.filter((e: { type: string }) => e.type === 'pharmacy.dispensed');
    expect(delivered).toEqual([expect.objectContaining({ data: { consultationId, status: 'completa', units: 25 } })]);
    expect(JSON.stringify(timeline)).not.toMatch(/Acetaminof|Loratadina/);
  });

  it('only serves signed prescriptions, and only to the pharmacy', async () => {
    const { consultationId } = await signedPrescription(false);
    expect((await api('alice').get(`${pharmacy}/${consultationId}`).expect(404)).body.code).toBe('PRESCRIPTION_NOT_FOUND');
    expect((await api('alice').get(pharmacy).expect(200)).body).toEqual([]);
    expect((await api('carol').get(pharmacy).expect(403)).body.code).toBe('PERMISSION_DENIED');
  });
});
