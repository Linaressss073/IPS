import { ActorInput } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import {
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

export interface ConsultationView {
  id: string;
  status: string;
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
