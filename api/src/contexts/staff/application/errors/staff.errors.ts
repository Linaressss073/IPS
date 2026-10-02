import { DomainError, TeamId } from '../../../../shared/domain/index.js';

export class StaffMemberNotFoundError extends DomainError {
  readonly kind = 'not-found';

  constructor(teamId: TeamId, userId: string) {
    super(`User ${userId} is not a member of team ${teamId.value}`, 'STAFF_MEMBER_NOT_FOUND');
  }
}

export class PermissionDeniedError extends DomainError {
  readonly kind = 'forbidden';

  constructor(permission: string) {
    super(`Your roles in this IPS do not allow "${permission}"`, 'PERMISSION_DENIED');
  }
}
