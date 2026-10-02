import { TeamId, UserId } from '../../../../shared/domain/index.js';

/** Port: a user's role in a team according to the identity provider; null if not a member. */
export interface TeamMembers {
  roleIn(userId: UserId, teamId: TeamId): Promise<string | null>;
}
