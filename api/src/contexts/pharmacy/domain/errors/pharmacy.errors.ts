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

export class InsufficientStockError extends DomainError {
  readonly kind = 'conflict';

  constructor(product: string, available: number) {
    super(`Only ${available} unit(s) of ${product} in stock (not expired)`, 'INSUFFICIENT_STOCK');
  }
}

export class ExpiredLotError extends DomainError {
  readonly kind = 'validation';

  constructor(lotNumber: string) {
    super(`Lot ${lotNumber} is already expired`, 'EXPIRED_LOT');
  }
}

export class LotExpiryMismatchError extends DomainError {
  readonly kind = 'conflict';

  constructor(lotNumber: string, expiresOn: string) {
    super(`Lot ${lotNumber} was received with expiry ${expiresOn}`, 'LOT_EXPIRY_MISMATCH');
  }
}

export class LotNotFoundError extends DomainError {
  readonly kind = 'not-found';

  constructor(lotNumber: string) {
    super(`Lot ${lotNumber} not found in this product`, 'LOT_NOT_FOUND');
  }
}

export class NegativeStockError extends DomainError {
  readonly kind = 'conflict';

  constructor(lotNumber: string, onHand: number) {
    super(`Lot ${lotNumber} has ${onHand} unit(s): it cannot go below zero`, 'NEGATIVE_STOCK');
  }
}

export class InactiveProductError extends DomainError {
  readonly kind = 'validation';

  constructor(name: string) {
    super(`${name} is inactive`, 'INACTIVE_PRODUCT');
  }
}
