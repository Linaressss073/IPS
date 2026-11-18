import type { TeamId } from '../../../../shared/domain/index.js';
import type {
  DOCUMENT_TYPES,
  REGIMES,
  RELATIONSHIPS,
  SEXES,
} from '../constants/patient.constants.js';
import type { Affiliation } from '../entities/affiliation.vo.js';
import type { BiologicalSex } from '../entities/biological-sex.vo.js';
import type { BirthDate } from '../entities/birth-date.vo.js';
import type { ContactInfo } from '../entities/contact-info.vo.js';
import type { IdentityDocument } from '../entities/identity-document.vo.js';
import type { PersonName } from '../entities/person-name.vo.js';

export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export type Sex = (typeof SEXES)[number];
export type Regime = (typeof REGIMES)[number];
export type Relationship = (typeof RELATIONSHIPS)[number];

/** Plain companion data, as stored in the "companion recorded" trace event. */
export interface CompanionData {
  relationship: Relationship | null;
  name: {
    firstName: string;
    middleName: string | null;
    firstLastName: string;
    secondLastName: string | null;
  } | null;
  document: { type: DocumentType; number: string } | null;
  phone: string | null;
  email: string | null;
}

/** The data that describes a patient (everything except identity and metadata). */
export interface PatientData {
  document: IdentityDocument;
  name: PersonName;
  birthDate: BirthDate;
  sex: BiologicalSex;
  contact: ContactInfo;
  affiliation: Affiliation;
}

/** The holder's authorization to process their data (Ley 1581 de 2012): who recorded it and when. */
export interface DataConsent {
  grantedAt: Date;
  grantedBy: string;
}

export interface PatientProps extends PatientData {
  teamId: TeamId;
  /** Null until the authorization is recorded; never part of an edit. */
  dataConsent: DataConsent | null;
  /** Increases on every change; used for optimistic locking. */
  version: number;
  registeredAt: Date;
  updatedAt: Date;
}

/** One field of a patient that changed, with plain before/after values. */
export interface FieldChange {
  field: keyof PatientData;
  from: unknown;
  to: unknown;
}
