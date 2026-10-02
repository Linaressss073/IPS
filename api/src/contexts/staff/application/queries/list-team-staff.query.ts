import { TeamId } from '../../../../shared/domain/index.js';
import { StaffReadModel } from '../ports/staff-read-model.port.js';
import { StaffMemberView } from '../types/staff.types.js';

/** The members of an IPS with their masked contact data. */
export class ListTeamStaff {
  constructor(private readonly readModel: StaffReadModel) {}

  execute(query: { teamId: TeamId }): Promise<StaffMemberView[]> {
    return this.readModel.listForTeam(query.teamId);
  }
}
