import { DomainError, TeamId } from '../../../../shared/domain/index.js';

export class NotATeamAdminError extends DomainError {
  readonly kind = 'forbidden';

  constructor(teamId: TeamId) {
    super(
      `Only administrators of team ${teamId.value} can do this`,
      'TEAM_ADMIN_REQUIRED',
    );
  }
}
