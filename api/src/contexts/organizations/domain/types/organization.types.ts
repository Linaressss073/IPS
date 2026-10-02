import type { ORGANIZATION_STATUSES } from '../constants/organization.constants.js';
import type { OrganizationName } from '../entities/organization-name.vo.js';
import type { OrganizationProfile } from '../entities/organization-profile.vo.js';

export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

/** Business data of an IPS that the identity provider does not hold. */
export interface OrganizationProfileProps {
  /** "900123456-8": base and DIAN check digit. */
  nit: string | null;
  /** Código de habilitación (REPS). */
  habilitationCode: string | null;
  address: string | null;
  city: string | null;
  department: string | null;
  phone: string | null;
  /** Institutional e-mail (not personal data). */
  email: string | null;
}

export interface OrganizationProps {
  name: OrganizationName;
  profile: OrganizationProfile;
  status: OrganizationStatus;
  /** Last change seen from the identity provider; older ones are ignored. */
  providerUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  /** Increases on every change; used for optimistic locking. */
  version: number;
  deletedAt: Date | null;
  /** Who deleted it from the app; null when deleted from the provider. */
  deletedBy: string | null;
}

export interface OrganizationFieldChange {
  field: 'name' | keyof OrganizationProfileProps;
  from: unknown;
  to: unknown;
}
