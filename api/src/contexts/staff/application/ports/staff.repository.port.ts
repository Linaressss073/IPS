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

  removeTeam(teamId: TeamId): Promise<void>;
}
