import { TeamId } from '../../../../shared/domain/index.js';
import { StaffMemberView } from '../types/staff.types.js';

/** Port (read side). */
export interface StaffReadModel {
  listForTeam(teamId: TeamId): Promise<StaffMemberView[]>;

  member(teamId: TeamId, userId: string): Promise<StaffMemberView | null>;

  /** The user's roles in the team; null if we have no membership for them. */
  rolesOf(teamId: TeamId, userId: string): Promise<string[] | null>;

  /**
   * Display names by user id. Anonymized users map to DELETED_USER_NAME;
   * unknown ids (or users without a name) are absent from the map.
   */
  namesFor(userIds: readonly string[]): Promise<Map<string, string>>;
}
