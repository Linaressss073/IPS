import { DomainError, TeamId } from '../../../../shared/domain/index.js';

/** Rules that need the repository or the provider, checked by the application. */

export class OrganizationNotFoundError extends DomainError {
  readonly kind = 'not-found';

  constructor(id: TeamId) {
    super(`Organization ${id.value} not found`, 'ORGANIZATION_NOT_FOUND');
  }
}

export class OrganizationVersionConflictError extends DomainError {
  readonly kind = 'conflict';

  constructor(id: TeamId) {
    super(
      `Organization ${id.value} was modified by someone else; reload it and try again`,
      'ORGANIZATION_VERSION_CONFLICT',
    );
  }
}

/** Two requests imported the same organization at once; the loser reloads. */
export class OrganizationAlreadyStoredError extends DomainError {
  readonly kind = 'conflict';

  constructor(id: TeamId) {
    super(`Organization ${id.value} is already stored`, 'ORGANIZATION_ALREADY_STORED');
  }
}
