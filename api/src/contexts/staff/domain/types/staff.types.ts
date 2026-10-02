import type { STAFF_ROLES } from '../constants/staff.constants.js';

export type StaffRole = (typeof STAFF_ROLES)[number];

/** The minimum we keep about a user of the identity provider. */
export interface StaffProfileProps {
  userId: string;
  displayName: string | null;
  emailMasked: string | null;
  /** Provider's last change; older updates arriving late are ignored. */
  sourceUpdatedAt: Date;
}
