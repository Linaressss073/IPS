import {
  TURN_COUNTERS_COLLECTION,
  TURNS_COLLECTION,
} from '../src/contexts/admission/infrastructure/persistence/mongo-admission.js';
import { CONSULTATIONS_COLLECTION } from '../src/contexts/consultation/infrastructure/persistence/mongo-consultation.js';
import { PATIENTS_COLLECTION } from '../src/contexts/patients/infrastructure/persistence/patient.document.js';
import { DISPENSATIONS_COLLECTION } from '../src/contexts/pharmacy/infrastructure/persistence/mongo-dispensation.js';
import {
  MOVEMENTS_COLLECTION,
  PRODUCTS_COLLECTION,
} from '../src/contexts/pharmacy/infrastructure/persistence/mongo-product.js';
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
  const products = `${team}/pharmacy/products`;
  const today = colombiaDate(new Date());
  /** Today plus `days`, YYYY-MM-DD. */
  const inDays = (days: number) => colombiaDate(new Date(Date.now() + days * 86_400_000));

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.wipe(
      DISPENSATIONS_COLLECTION,
      PRODUCTS_COLLECTION,
      MOVEMENTS_COLLECTION,
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

  /** Acetaminofén with 30 units and Loratadina with 4 (one lot each, far from expiring). */
  const stock = async () => {
    const product = async (name: string, units: number) => {
      const created = (await api('alice').post(products, { name, presentation: 'Tableta', minStock: 5 }).expect(201)).body;
      await api('alice')
        .post(`${products}/${created.id}/lots`, { lotNumber: `L-${units}`, expiresOn: inDays(365), quantity: units })
        .expect(201);
      return created.id as string;
    };
    return { acetaminofen: await product('Acetaminofén 500 mg', 30), loratadina: await product('Loratadina 10 mg', 4) };
  };

  it('delivers in parts, never more than prescribed, taking the stock', async () => {
    const { consultationId } = await signedPrescription();
    const { acetaminofen: a, loratadina: l } = await stock();

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
        .post(url, {
          version: 0,
          lines: [
            { index: 0, quantity: 15, productId: a },
            { index: 1, quantity: 4, productId: l },
          ],
          note: 'Sin existencias de loratadina',
        })
        .expect(200)
    ).body;
    expect(partial).toMatchObject({ status: 'parcial', version: 1, items: [{ pending: 0 }, { delivered: 4, pending: 6 }] });
    expect(partial.deliveries[0]).toMatchObject({
      by: 'alice',
      note: 'Sin existencias de loratadina',
      lines: [
        { index: 0, productId: a, lots: [{ lotNumber: 'L-30', quantity: 15 }] },
        { index: 1, productId: l, lots: [{ lotNumber: 'L-4', quantity: 4 }] },
      ],
    });
    // The stock went down with the delivery.
    expect((await api('alice').get(`${products}/${l}`).expect(200)).body).toMatchObject({ available: 0, alerts: ['stock_bajo'] });

    // Out of stock: rejected and nothing changes.
    const line = (quantity: number) => [{ index: 1, quantity, productId: l }];
    expect((await api('alice').post(url, { version: 1, lines: line(6) }).expect(409)).body.code).toBe('INSUFFICIENT_STOCK');
    expect((await api('alice').post(url, { version: 1, lines: line(7) }).expect(400)).body.code).toBe('OVER_DELIVERY');
    expect((await api('alice').post(url, { version: 0, lines: line(6) }).expect(409)).body.code).toBe(
      'DISPENSATION_VERSION_CONFLICT',
    );

    await api('alice').post(`${products}/${l}/lots`, { lotNumber: 'L-NEW', expiresOn: inDays(200), quantity: 20 }).expect(201);
    const complete = (await api('alice').post(url, { version: 1, lines: line(6) }).expect(200)).body;
    expect(complete).toMatchObject({ status: 'completa', version: 2 });
    expect(
      (await api('alice').post(url, { version: 2, lines: [{ index: 0, quantity: 1, productId: a }] }).expect(409)).body.code,
    ).toBe('NOTHING_PENDING');
    expect((await api('alice').get(`${products}/${l}`).expect(200)).body).toMatchObject({ available: 14 });
    expect((await api('alice').get(`${pharmacy}?status=completa`).expect(200)).body).toHaveLength(1);
  });

  it('calls the patient with a FAR turn at a pharmacy window, on the shared screen', async () => {
    const { patientId, consultationId } = await signedPrescription();
    const { acetaminofen: a, loratadina: l } = await stock();
    await api('alice').post(`${products}/${l}/lots`, { lotNumber: 'L-MORE', expiresOn: inDays(300), quantity: 6 }).expect(201);
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
      .post(`${pharmacy}/${consultationId}/deliveries`, {
        version: 0,
        lines: [
          { index: 0, quantity: 15, productId: a },
          { index: 1, quantity: 10, productId: l },
        ],
      })
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

  it('keeps lots and a kardex: FEFO, no expired stock, adjustments with a reason', async () => {
    const product = (
      await api('alice').post(products, { name: 'Amoxicilina 500 mg', presentation: 'Cápsula', minStock: 10 }).expect(201)
    ).body;
    expect(
      (await api('alice').post(products, { name: 'amoxicilina  500 MG', presentation: 'cápsula', minStock: 0 }).expect(409)).body
        .code,
    ).toBe('PRODUCT_TAKEN');
    const lots = `${products}/${product.id}/lots`;
    expect((await api('alice').post(lots, { lotNumber: 'OLD', expiresOn: inDays(-1), quantity: 5 }).expect(400)).body.code).toBe(
      'EXPIRED_LOT',
    );
    await api('alice')
      .post(lots, { lotNumber: 'late', expiresOn: inDays(400), quantity: 20, supplier: 'Droguería Central' })
      .expect(201);
    await api('alice').post(lots, { lotNumber: 'SOON', expiresOn: inDays(10), quantity: 8 }).expect(201);
    expect((await api('alice').post(lots, { lotNumber: 'SOON', expiresOn: inDays(20), quantity: 1 }).expect(409)).body.code).toBe(
      'LOT_EXPIRY_MISMATCH',
    );

    expect((await api('alice').get(`${products}/${product.id}`).expect(200)).body).toMatchObject({
      available: 28,
      expired: 0,
      alerts: ['por_vencer'],
      lots: [
        { lotNumber: 'SOON', quantity: 8, status: 'por_vencer' },
        { lotNumber: 'LATE', quantity: 20, status: 'vigente' },
      ],
    });

    // A delivery takes from the lot expiring first, then the next.
    const { consultationId } = await signedPrescription();
    const deliveries = `${pharmacy}/${consultationId}/deliveries`;
    const delivered = (
      await api('alice').post(deliveries, { version: 0, lines: [{ index: 0, quantity: 12, productId: product.id }] }).expect(200)
    ).body;
    expect(delivered.deliveries[0].lines[0].lots).toEqual([
      { lotNumber: 'SOON', expiresOn: inDays(10), quantity: 8 },
      { lotNumber: 'LATE', expiresOn: inDays(400), quantity: 4 },
    ]);

    // A write-off needs a reason and never goes below zero.
    const adjust = `${products}/${product.id}/adjustments`;
    expect((await api('alice').post(adjust, { lotNumber: 'LATE', quantity: -17, reason: 'Conteo' }).expect(409)).body.code).toBe(
      'NEGATIVE_STOCK',
    );
    expect((await api('alice').post(adjust, { lotNumber: 'LATE', quantity: -2, reason: '' }).expect(400)).body.code).toBe(
      'INVALID_VALUE',
    );
    expect((await api('alice').post(adjust, { lotNumber: 'NOPE', quantity: -2, reason: 'Dañado' }).expect(404)).body.code).toBe(
      'LOT_NOT_FOUND',
    );
    expect(
      (await api('alice').post(adjust, { lotNumber: 'late', quantity: -2, reason: 'Blíster dañado' }).expect(201)).body,
    ).toMatchObject({ available: 14, alerts: [] });

    const kardex = (await api('alice').get(`${products}/${product.id}/movements`).expect(200)).body as {
      type: string;
      lotNumber: string;
      quantity: number;
      reference: unknown;
    }[];
    expect(kardex.map((m) => [m.type, m.lotNumber, m.quantity])).toEqual(
      expect.arrayContaining([
        ['entrada', 'LATE', 20],
        ['entrada', 'SOON', 8],
        ['salida', 'SOON', -8],
        ['salida', 'LATE', -4],
        ['ajuste', 'LATE', -2],
      ]),
    );
    expect(kardex).toHaveLength(5);
    expect(kardex.find((m) => m.type === 'salida')?.reference).toEqual({ kind: 'dispensacion', consultationId });

    // An inactive product is not dispensed; the physician has no access.
    await api('alice').patch(`${products}/${product.id}`, { active: false }).expect(200);
    expect(
      (await api('alice').post(deliveries, { version: 1, lines: [{ index: 0, quantity: 1, productId: product.id }] }).expect(400))
        .body.code,
    ).toBe('INACTIVE_PRODUCT');
    expect((await api('carol').get(products).expect(403)).body.code).toBe('PERMISSION_DENIED');
  });
});
