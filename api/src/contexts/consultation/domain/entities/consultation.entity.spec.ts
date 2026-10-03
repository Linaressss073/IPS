import { InvalidValueError, TeamId } from '../../../../shared/domain/index.js';
import {
  AppointmentNotAttendableError,
  ConsultationNotSignedError,
  ConsultationSignedError,
  IncompleteConsultationError,
  NotTheTreatingPhysicianError,
} from '../errors/consultation.errors.js';
import { ClinicalNote, Diagnoses, Prescription, VitalSigns } from './clinical-record.vo.js';
import { AppointmentSnapshot, Consultation } from './consultation.entity.js';

const teamId = TeamId.of('org_2xTeamA9fKq4LmN8pRsT1uVwY');
// 2026-10-05 07:00 in Colombia.
const now = new Date('2026-10-05T12:00:00Z');
const appointment: AppointmentSnapshot = {
  id: '9b7e0000-0000-4000-8000-000000000001',
  status: 'confirmada',
  patientId: '12530000-0000-4000-8000-000000000001',
  professionalId: 'user_doctor',
  service: { id: 's1', code: 'MG', name: 'Medicina general' },
  location: { id: 'l1', label: 'Consultorio 301' },
  date: '2026-10-05',
  time: '07:20',
};
const start = (overrides: Partial<AppointmentSnapshot> = {}, physicianId = 'user_doctor') =>
  Consultation.start({ teamId, appointment: { ...appointment, ...overrides }, physicianId, now });

const note = (reason: string) =>
  ClinicalNote.of({ reason, currentIllness: 'Tres días de fiebre y tos.', physicalExam: '', plan: '' });

describe('Clinical record values', () => {
  it('validates vital signs, rounds them and computes the BMI', () => {
    const vitals = VitalSigns.of([
      { name: 'temperatura', value: 38.46 },
      { name: 'peso', value: 70 },
      { name: 'talla', value: 175 },
    ]);
    expect(vitals.value[0]).toEqual({ name: 'temperatura', value: 38.5 });
    expect(vitals.bmi).toEqual([22.9]);
    expect(VitalSigns.of([{ name: 'temperatura', value: 37 }]).bmi).toEqual([]);
    expect(() => VitalSigns.of([{ name: 'temperatura', value: 52 }])).toThrow(InvalidValueError);
    expect(() =>
      VitalSigns.of([
        { name: 'peso', value: 70 },
        { name: 'peso', value: 71 },
      ]),
    ).toThrow('repeated');
  });

  it('accepts CIE-10 codes with one principal diagnosis', () => {
    const diagnoses = Diagnoses.of([
      { code: 'j06.9', description: 'Infección aguda de las vías respiratorias superiores', principal: true },
      { code: 'R50.9', description: 'Fiebre no especificada', principal: false },
    ]);
    expect(diagnoses.value[0].code).toBe('J06.9');
    expect(diagnoses.hasPrincipal).toBe(true);
    expect(() => Diagnoses.of([{ code: 'XYZ', description: 'x', principal: true }])).toThrow('CIE-10');
    expect(() =>
      Diagnoses.of([
        { code: 'J06.9', description: 'a', principal: true },
        { code: 'R50.9', description: 'b', principal: true },
      ]),
    ).toThrow('Only one');
  });

  it('validates the prescription', () => {
    const item = {
      medication: 'Acetaminofén 500 mg',
      presentation: 'Tableta',
      dose: '1 tableta',
      route: 'oral',
      frequency: 'Cada 8 horas',
      durationDays: 5,
      quantity: 15,
      instructions: 'Después de las comidas',
    } as const;
    expect(Prescription.of([item]).value).toHaveLength(1);
    expect(() => Prescription.of([{ ...item, route: 'por la boca' as never }])).toThrow('route');
    expect(() => Prescription.of([{ ...item, quantity: 0 }])).toThrow('quantity');
  });
});

describe('Consultation', () => {
  it('is opened only by the physician of the appointment, on or after its day', () => {
    expect(start().status).toBe('en_curso');
    expect(() => start({}, 'user_other')).toThrow(NotTheTreatingPhysicianError);
    expect(() => start({ status: 'cancelada' })).toThrow(AppointmentNotAttendableError);
    expect(() => start({ date: '2026-10-06' })).toThrow(AppointmentNotAttendableError);
  });

  it('is signed with a reason and a principal diagnosis, then frozen', () => {
    const consultation = start();
    expect(() => consultation.sign('user_doctor', now)).toThrow(IncompleteConsultationError);

    consultation.update(
      'user_doctor',
      {
        note: note('Fiebre y tos'),
        diagnoses: Diagnoses.of([{ code: 'J06.9', description: 'IRA alta', principal: true }]),
      },
      now,
    );
    expect(() => consultation.update('user_other', { note: note('x') }, now)).toThrow(NotTheTreatingPhysicianError);
    expect(() => consultation.addAddendum('user_doctor', 'Nota', now)).toThrow(ConsultationNotSignedError);

    consultation.sign('user_doctor', now);
    expect(consultation).toMatchObject({ status: 'firmada', signature: { signed: true, at: now } });
    expect(() => consultation.update('user_doctor', { note: note('Otro') }, now)).toThrow(ConsultationSignedError);
    expect(() => consultation.sign('user_doctor', now)).toThrow(ConsultationSignedError);

    consultation.addAddendum('user_doctor', 'Resultado de laboratorio: normal.', now);
    expect(consultation.addenda).toEqual([
      { text: 'Resultado de laboratorio: normal.', writtenBy: 'user_doctor', writtenAt: now },
    ]);
    expect(consultation.note.value.reason).toBe('Fiebre y tos');
  });
});
