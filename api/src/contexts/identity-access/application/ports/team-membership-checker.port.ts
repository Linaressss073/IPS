import { TeamId, UserId } from '../../../../shared/domain/index.js';

/** Port: whether a user belongs to a team (tenant), and with which role. */
export interface TeamMembershipChecker {
  isMember(userId: UserId, teamId: TeamId): Promise<boolean>;

  /** "admin", "member"… (without the provider's "org:" prefix); throws NotATeamMemberError if not a member. */
  roleIn(userId: UserId, teamId: TeamId): Promise<string>;
}
