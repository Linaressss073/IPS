import { TeamId } from '../../../../shared/domain/index.js';
import { StaffMemberView } from '../types/staff.types.js';

/** Port (read side). */
export interface StaffReadModel {
  listForTeam(teamId: TeamId): Promise<StaffMemberView[]>;

  /** Throws StaffMemberNotFoundError if the user is not in the team's directory. */
  getMember(teamId: TeamId, userId: string): Promise<StaffMemberView>;

  /** The user's functional roles in the team; none if they have no membership. */
  rolesOf(teamId: TeamId, userId: string): Promise<string[]>;

  /**
   * Display names by user id. Anonymized users map to DELETED_USER_NAME;
   * unknown ids (or users without a name) are absent from the map.
   */
  namesFor(userIds: readonly string[]): Promise<Map<string, string>>;
}
