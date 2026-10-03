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
import { AuthenticatedRequest } from './authenticated-request.js';

/**
 * Tenant isolation: the `:teamId` route param must be a team the caller
 * belongs to. Must run after AccessTokenGuard. The team selected in the
 * signed token (and its role) is trusted as is; any other team is checked
 * with the provider.
 */
@Injectable()
export class TeamMemberGuard implements CanActivate {
  constructor(
    @Inject(TEAM_MEMBERSHIP_CHECKER)
    private readonly membership: TeamMembershipChecker,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const auth = request.auth;
    if (!auth) throw new UnauthorizedException();

    const teamId = TeamId.of(String(request.params.teamId));
    const selectedInToken = teamId.equals(auth.selectedTeamId ?? undefined);
    // roleIn throws NotATeamMemberError (403) for anyone outside the team.
    const role = selectedInToken
      ? (auth.selectedTeamRole ?? (await this.membership.roleIn(auth.userId, teamId)))
      : await this.membership.roleIn(auth.userId, teamId);

    request.teamId = teamId;
    request.teamRole = role;
    return true;
  }
}
