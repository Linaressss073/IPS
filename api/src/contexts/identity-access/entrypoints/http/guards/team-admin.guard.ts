import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TEAM_ADMIN_ROLE } from '../../../domain/constants/roles.js';
import { NotATeamAdminError } from '../../../domain/errors/not-a-team-admin.error.js';
import { AuthenticatedRequest } from './authenticated-request.js';

/** Only the team's administrators. Must run after TeamMemberGuard. */
@Injectable()
export class TeamAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.teamRole !== TEAM_ADMIN_ROLE) {
      throw new NotATeamAdminError(request.teamId!);
    }
    return true;
  }
}
