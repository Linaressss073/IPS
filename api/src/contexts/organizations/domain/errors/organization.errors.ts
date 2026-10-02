import { DomainError, TeamId } from '../../../../shared/domain/index.js';

/** Invariant violations raised by the Organization aggregate itself. */

export class OrganizationDeletedError extends DomainError {
  readonly kind = 'conflict';

  constructor(id: TeamId) {
    super(`Organization ${id.value} was deleted`, 'ORGANIZATION_DELETED');
  }
}
