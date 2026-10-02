import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { TeamId } from '../../../../../shared/domain/index.js';
import { TEAM_ADMIN_ROLE } from '../../../../identity-access/domain/constants/roles.js';
import { AuthenticatedUser } from '../../../../identity-access/domain/entities/authenticated-user.entity.js';
import {
  CurrentTeam,
  CurrentTeamRole,
  CurrentUser,
  TeamScoped,
} from '../../../../identity-access/entrypoints/http/decorators/auth.decorators.js';
import { AssignStaffRoles } from '../../../application/commands/assign-staff-roles.command.js';
import { ListTeamStaff } from '../../../application/queries/list-team-staff.query.js';
import { AccessService } from '../../../application/services/access.service.js';
import { MyAccessView, StaffMemberView } from '../../../application/types/staff.types.js';
import { AssignStaffRolesDto } from '../dto/staff.dto.js';
import { RequirePermission } from '../guards/permission.guard.js';

/** The members of an IPS, the caller's own access, and role assignment. */
@Controller('teams/:teamId/staff')
export class StaffController {
  constructor(
    private readonly listTeamStaff: ListTeamStaff,
    private readonly access: AccessService,
    private readonly assignStaffRoles: AssignStaffRoles,
  ) {}

  @Get()
  @TeamScoped()
  list(@CurrentTeam() teamId: TeamId): Promise<StaffMemberView[]> {
    return this.listTeamStaff.execute({ teamId });
  }

  /** What the caller may do here, so the UI only offers that. */
  @Get('me')
  @TeamScoped()
  me(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTeamRole() teamRole: string,
  ): Promise<MyAccessView> {
    return this.access.accessOf({
      teamId,
      userId: user.userId.value,
      isAdmin: teamRole === TEAM_ADMIN_ROLE,
    });
  }

  @Put(':userId/roles')
  @RequirePermission('staff:manage')
  assignRoles(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: AssignStaffRolesDto,
  ): Promise<StaffMemberView> {
    return this.assignStaffRoles.execute({
      teamId,
      userId,
      roles: dto.roles,
      actor: { requestedBy: user.userId, executedBy: user.userId },
    });
  }
}
