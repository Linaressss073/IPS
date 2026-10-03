import { DomainError } from '../../../../shared/domain/index.js';

export class TurnNotFoundError extends DomainError {
  readonly kind = 'not-found';

  constructor(id: string) {
    super(`Turn ${id} not found`, 'TURN_NOT_FOUND');
  }
}

export class AlreadyCheckedInError extends DomainError {
  readonly kind = 'conflict';

  constructor() {
    super('The patient already checked in for this appointment', 'ALREADY_CHECKED_IN');
  }
}

export class TurnVersionConflictError extends DomainError {
  readonly kind = 'conflict';

  constructor(id: string) {
    super(`Turn ${id} changed (another call or an automatic re-announcement); reload it`, 'TURN_VERSION_CONFLICT');
  }
}
