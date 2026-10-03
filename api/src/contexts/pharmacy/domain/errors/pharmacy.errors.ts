import { DomainError } from '../../../../shared/domain/index.js';

export class OverDeliveryError extends DomainError {
  readonly kind = 'validation';

  constructor(medication: string, pending: number) {
    super(`Only ${pending} unit(s) of ${medication} are pending`, 'OVER_DELIVERY');
  }
}

export class NothingPendingError extends DomainError {
  readonly kind = 'conflict';

  constructor() {
    super('Everything prescribed was already delivered', 'NOTHING_PENDING');
  }
}
