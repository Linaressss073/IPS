import { DomainError, TeamId } from '../../../../shared/domain/index.js';

export class NotATeamMemberError extends DomainError {
  readonly kind = 'forbidden';

  constructor(teamId: TeamId) {
    super(`You are not a member of team ${teamId.value}`, 'NOT_A_TEAM_MEMBER');
  }
}
