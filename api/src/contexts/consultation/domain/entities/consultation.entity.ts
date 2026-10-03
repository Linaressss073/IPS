import {
  colombiaDate,
  Entity,
  generateUuid,
  InvalidValueError,
  isUuid,
  TeamId,
  ValueObject,
} from '../../../../shared/domain/index.js';
import { NOTE_FIELD_MAX } from '../constants/consultation.constants.js';
import {
  AppointmentNotAttendableError,
  ConsultationNotSignedError,
  ConsultationSignedError,
  IncompleteConsultationError,
  NotTheTreatingPhysicianError,
} from '../errors/consultation.errors.js';
import { AddendumProps, ConsultationStatus } from '../types/consultation.types.js';
import { ClinicalNote, Diagnoses, Prescription, VitalSigns } from './clinical-record.vo.js';

export class ConsultationId extends ValueObject<string> {
  static generate(): ConsultationId {
    return new ConsultationId(generateUuid());
  }

  static of(value: string): ConsultationId {
    if (!isUuid(value ?? '')) throw new InvalidValueError(`Invalid consultation id: "${value}"`);
    return new ConsultationId(value.toLowerCase());
  }
}

/** What the consultation needs of the appointment, copied when it starts. */
export interface AppointmentSnapshot {
  id: string;
  status: string;
  patientId: string;
  professionalId: string;
  service: { id: string; code: string; name: string };
  location: { id: string; label: string };
  date: string;
  time: string;
}

/** Signed or not; when signed, since when. */
export type Signature = { signed: false } | { signed: true; at: Date };

export interface ConsultationProps {
  teamId: TeamId;
  appointment: AppointmentSnapshot;
  note: ClinicalNote;
  vitals: VitalSigns;
  diagnoses: Diagnoses;
  prescription: Prescription;
  signature: Signature;
  addenda: AddendumProps[];
  startedAt: Date;
  updatedAt: Date;
  version: number;
}

export interface ConsultationChanges {
  note?: ClinicalNote;
  vitals?: VitalSigns;
  diagnoses?: Diagnoses;
  prescription?: Prescription;
}

/**
 * Aggregate root: the clinical record of one appointment, written by its
 * physician. A draft (en_curso) until signed; once signed it never changes
 * again and corrections are appended as addenda.
 */
export class Consultation extends Entity<ConsultationId> {
  private constructor(
    id: ConsultationId,
    private props: ConsultationProps,
  ) {
    super(id);
  }

  static start(input: {
    teamId: TeamId;
    appointment: AppointmentSnapshot;
    physicianId: string;
    now: Date;
  }): Consultation {
    const { appointment } = input;
    if (appointment.professionalId !== input.physicianId) throw new NotTheTreatingPhysicianError();
    if (appointment.status === 'cancelada') throw new AppointmentNotAttendableError('it was cancelled');
    if (appointment.date > colombiaDate(input.now)) {
      throw new AppointmentNotAttendableError(`it is on ${appointment.date}`);
    }
    return new Consultation(ConsultationId.generate(), {
      teamId: input.teamId,
      appointment: { ...appointment },
      note: ClinicalNote.EMPTY,
      vitals: VitalSigns.NONE,
      diagnoses: Diagnoses.NONE,
      prescription: Prescription.NONE,
      signature: { signed: false },
      addenda: [],
      startedAt: input.now,
      updatedAt: input.now,
      version: 1,
    });
  }

  static restore(id: ConsultationId, props: ConsultationProps): Consultation {
    return new Consultation(id, { ...props, addenda: [...props.addenda] });
  }

  /** Draft changes by the treating physician; each group replaces the previous one. */
  update(physicianId: string, changes: ConsultationChanges, now: Date): void {
    this.ensureTreating(physicianId);
    if (this.props.signature.signed) throw new ConsultationSignedError();
    if (changes.note) this.props.note = changes.note;
    if (changes.vitals) this.props.vitals = changes.vitals;
    if (changes.diagnoses) this.props.diagnoses = changes.diagnoses;
    if (changes.prescription) this.props.prescription = changes.prescription;
    this.touch(now);
  }

  /** Requires the reason for consultation and a principal diagnosis. */
  sign(physicianId: string, now: Date): void {
    this.ensureTreating(physicianId);
    if (this.props.signature.signed) throw new ConsultationSignedError();
    const missing = [
      !this.props.note.value.reason && 'motivo de consulta',
      !this.props.diagnoses.hasPrincipal && 'diagnóstico principal',
    ].filter((item): item is string => !!item);
    if (missing.length > 0) throw new IncompleteConsultationError(missing);
    this.props.signature = { signed: true, at: now };
    this.touch(now);
  }

  /** A correction or a later finding on a signed consultation. */
  addAddendum(physicianId: string, text: string, now: Date): void {
    this.ensureTreating(physicianId);
    if (!this.props.signature.signed) throw new ConsultationNotSignedError();
    const trimmed = (text ?? '').trim();
    if (!trimmed || trimmed.length > NOTE_FIELD_MAX) {
      throw new InvalidValueError(`The addendum must have between 1 and ${NOTE_FIELD_MAX} characters`);
    }
    this.props.addenda.push({ text: trimmed, writtenBy: physicianId, writtenAt: now });
    this.touch(now);
  }

  get status(): ConsultationStatus {
    return this.props.signature.signed ? 'firmada' : 'en_curso';
  }
  get teamId(): TeamId {
    return this.props.teamId;
  }
  get appointment(): AppointmentSnapshot {
    return this.props.appointment;
  }
  get patientId(): string {
    return this.props.appointment.patientId;
  }
  get physicianId(): string {
    return this.props.appointment.professionalId;
  }
  get note(): ClinicalNote {
    return this.props.note;
  }
  get vitals(): VitalSigns {
    return this.props.vitals;
  }
  get diagnoses(): Diagnoses {
    return this.props.diagnoses;
  }
  get prescription(): Prescription {
    return this.props.prescription;
  }
  get signature(): Signature {
    return this.props.signature;
  }
  get addenda(): readonly AddendumProps[] {
    return this.props.addenda;
  }
  get startedAt(): Date {
    return this.props.startedAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get version(): number {
    return this.props.version;
  }

  private ensureTreating(physicianId: string): void {
    if (physicianId !== this.physicianId) throw new NotTheTreatingPhysicianError();
  }

  private touch(now: Date): void {
    this.props.updatedAt = now;
    this.props.version += 1;
  }
}
