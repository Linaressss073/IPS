import { TeamId, UserId } from '../../domain/index.js';

/** Port: whether a user belongs to a team (used to validate requestedBy). */
export interface TeamMembers {
  isMember(userId: UserId, teamId: TeamId): Promise<boolean>;
}
