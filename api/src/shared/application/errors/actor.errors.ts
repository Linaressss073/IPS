import { DomainError, UserId } from '../../domain/index.js';

export class RequesterNotATeamMemberError extends DomainError {
  readonly kind = 'validation';

  constructor(userId: UserId) {
    super(
      `requestedBy "${userId.value}" is not a member of this team`,
      'INVALID_REQUESTER',
    );
  }
}
