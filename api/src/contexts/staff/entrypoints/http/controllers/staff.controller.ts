import { Controller, Get } from '@nestjs/common';
import { TeamId } from '../../../../../shared/domain/index.js';
import {
  CurrentTeam,
  TeamScoped,
} from '../../../../identity-access/entrypoints/http/decorators/auth.decorators.js';
import { ListTeamStaff } from '../../../application/queries/list-team-staff.query.js';
import { StaffMemberView } from '../../../application/types/staff.types.js';

/** Read side: the members of an IPS, visible only to its own members. */
@TeamScoped()
@Controller('teams/:teamId/staff')
export class StaffController {
  constructor(private readonly listTeamStaff: ListTeamStaff) {}

  @Get()
  list(@CurrentTeam() teamId: TeamId): Promise<StaffMemberView[]> {
    return this.listTeamStaff.execute({ teamId });
  }
}
