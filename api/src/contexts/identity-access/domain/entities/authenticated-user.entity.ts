import { TeamId, UserId } from '../../../../shared/domain/index.js';

/** Who is calling the API, as asserted by a verified access token. */
export class AuthenticatedUser {
  constructor(
    readonly userId: UserId,
    readonly selectedTeamId: TeamId | null,
  ) {}
}
