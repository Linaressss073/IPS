import { TeamId, UserId } from '../../../../shared/domain/index.js';

/** Port: answers whether a user belongs to a team (tenant). */
export interface TeamMembershipChecker {
  isMember(userId: UserId, teamId: TeamId): Promise<boolean>;
}
