import { TraceEvent } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import { StaffProfile } from '../../domain/entities/staff-profile.vo.js';

/** Port (write side): the local copy of the provider's users and memberships. */
export interface StaffRepository {
  /**
   * Inserts or updates a profile. Updates older than the stored one are
   * ignored (webhooks may arrive out of order); `onlyIfMissing` never
   * overwrites an existing profile.
   */
  saveProfile(
    profile: StaffProfile,
    options?: { onlyIfMissing?: boolean },
  ): Promise<void>;

  /** Right to be forgotten: drops name and e-mail and every membership. */
  anonymize(userId: string, at: Date): Promise<void>;

  saveMembership(input: {
    teamId: TeamId;
    userId: string;
    providerRole: string;
    sourceUpdatedAt: Date;
  }): Promise<void>;

  removeMembership(teamId: TeamId, userId: string): Promise<void>;

  /**
   * Creates the membership if we do not have it yet (e.g. webhooks were set
   * up after the user joined). Its date is the epoch, so any real provider
   * update wins over it.
   */
  ensureMembership(teamId: TeamId, userId: string, providerRole: string): Promise<void>;

  /** Replaces the user's roles in the team and appends the trace events, atomically. */
  setRoles(
    teamId: TeamId,
    userId: string,
    roles: readonly string[],
    events: readonly TraceEvent[],
  ): Promise<void>;

  /**
   * Users not anonymized, with the dates the provider last changed them and
   * their memberships: used to find what the provider no longer has.
   */
  listActive(): Promise<StoredStaffUser[]>;

  /** Removes every membership of the team; returns the users it had. */
  removeTeam(teamId: TeamId): Promise<string[]>;
}

export interface StoredStaffUser {
  userId: string;
  sourceUpdatedAt: Date;
  teams: { teamId: string; sourceUpdatedAt: Date }[];
}
