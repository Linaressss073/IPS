import type { Db } from 'mongodb';

export const STAFF_COLLECTION = 'staff';

/** Memberships created by us before the provider told us about them. */
export const UNKNOWN_SOURCE_DATE = new Date(0);

/**
 * One document per user of the identity provider, minimized: a display name
 * and a masked e-mail only. Deleted users keep their (pseudonymous) id so
 * the audit trail still links, but lose every personal field and team.
 */
export interface StaffDocument {
  _id: string;
  displayName: string | null;
  emailMasked: string | null;
  deleted: boolean;
  deletedAt: Date | null;
  /** The IPS the user belongs to, with the provider role and our roles. */
  teams: StaffTeamEntry[];
  /** When the provider last changed the profile (stale webhooks are ignored). */
  sourceUpdatedAt: Date;
}

export interface StaffTeamEntry {
  teamId: string;
  providerRole: string;
  /**
   * agendamiento, admision, medico, farmacia, soporte (assigned by admins).
   * Missing in documents written before roles existed: read it as [].
   */
  roles?: string[];
  sourceUpdatedAt: Date;
}

/** "Who works at this IPS" queries go through teams.teamId. */
export async function ensureStaffIndexes(db: Db): Promise<void> {
  await db.collection<StaffDocument>(STAFF_COLLECTION).createIndex({ 'teams.teamId': 1 });
}
