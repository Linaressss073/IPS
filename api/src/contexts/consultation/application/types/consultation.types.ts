import { ActorInput } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import type { PatientView } from '../../../patients/application/types/patient.types.js';
import {
  ConsultationStatus,
  DiagnosisProps,
  NoteProps,
  PrescriptionItemProps,
  VitalSignProps,
} from '../../domain/types/consultation.types.js';

export interface UpdateConsultationCommand {
  teamId: TeamId;
  consultationId: string;
  expectedVersion: number;
  note?: NoteProps;
  vitals?: VitalSignProps[];
  diagnoses?: DiagnosisProps[];
  prescription?: PrescriptionItemProps[];
  actor: ActorInput;
}

/**
 * What the pharmacy sees of a signed consultation: the prescription and who
 * signed it, never the clinical note or the diagnoses.
 */
export interface PrescriptionView {
  consultationId: string;
  patientId: string;
  physicianId: string;
  /** Day of the consultation (Colombia). */
  date: string;
  signedAt: string;
  items: PrescriptionItemProps[];
}

export interface ConsultationView {
  id: string;
  status: ConsultationStatus;
  signature: { signed: false } | { signed: true; at: string };
  patient: { id: string; fullName: string; document: { type: string; number: string } };
  physician: { userId: string; displayName: string };
  appointment: { id: string; date: string; time: string };
  service: { id: string; code: string; name: string };
  location: { id: string; label: string };
  note: NoteProps;
  vitals: (VitalSignProps & { unit: string })[];
  /** Body mass index, when weight and height were measured. */
  bmi: number[];
  diagnoses: DiagnosisProps[];
  prescription: PrescriptionItemProps[];
  addenda: { text: string; writtenBy: string; writtenByName: string; writtenAt: string }[];
  startedAt: string;
  updatedAt: string;
  version: number;
}

/** Everything printed on the prescription; the frontend's BFF turns it into a PDF. */
export interface FormulaView {
  consultationId: string;
  signedAt: string;
  ips: {
    name: string;
    nit: string | null;
    habilitationCode: string | null;
    address: string | null;
    city: string | null;
    department: string | null;
    phone: string | null;
  };
  patient: {
    fullName: string;
    document: { type: string; number: string };
    sex: PatientView['sex'];
    birthDate: string;
    eps: string | null;
    regime: string;
  };
  physician: { displayName: string };
  service: string;
  diagnoses: DiagnosisProps[];
  prescription: PrescriptionItemProps[];
}
