import {
  CONSULTATION_STATUSES,
  ROUTES,
  VITAL_SIGNS,
} from '../constants/consultation.constants.js';

export type ConsultationStatus = (typeof CONSULTATION_STATUSES)[number];
export type VitalSignName = keyof typeof VITAL_SIGNS;
export type Route = (typeof ROUTES)[number];

/** What the physician writes (free text; empty until filled in). */
export interface NoteProps {
  reason: string;
  currentIllness: string;
  physicalExam: string;
  plan: string;
}

export interface VitalSignProps {
  name: VitalSignName;
  value: number;
}

export interface DiagnosisProps {
  /** CIE-10 code, e.g. "J06.9". */
  code: string;
  description: string;
  /** Exactly one diagnosis is the main one (principal) to sign. */
  principal: boolean;
}

export interface PrescriptionItemProps {
  medication: string;
  presentation: string;
  dose: string;
  route: Route;
  frequency: string;
  durationDays: number;
  quantity: number;
  instructions: string;
}

export interface AddendumProps {
  text: string;
  writtenBy: string;
  writtenAt: Date;
}
