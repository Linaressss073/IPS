import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TeamId } from '../../../../../shared/domain/index.js';
import { TEAM_MEMBERSHIP_CHECKER } from '../../../application/constants/injection-tokens.js';
import type { TeamMembershipChecker } from '../../../application/ports/team-membership-checker.port.js';
import { NotATeamMemberError } from '../../../domain/errors/not-a-team-member.error.js';
import { AuthenticatedRequest } from './authenticated-request.js';

/**
 * Tenant isolation: the `:teamId` route param must be a team the caller
 * belongs to. Must run after AccessTokenGuard.
 */
@Injectable()
export class TeamMemberGuard implements CanActivate {
  constructor(
    @Inject(TEAM_MEMBERSHIP_CHECKER)
    private readonly membership: TeamMembershipChecker,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.auth) throw new UnauthorizedException();

    const teamId = TeamId.of(String(request.params.teamId));
    if (!(await this.membership.isMember(request.auth.userId, teamId))) {
      throw new NotATeamMemberError(teamId);
    }

    request.teamId = teamId;
    return true;
  }
}
