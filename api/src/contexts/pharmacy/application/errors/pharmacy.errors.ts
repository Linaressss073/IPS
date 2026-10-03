import { DomainError } from '../../../../shared/domain/index.js';

export class DispensationVersionConflictError extends DomainError {
  readonly kind = 'conflict';

  constructor(consultationId: string) {
    super(
      `The dispensation of ${consultationId} changed (another delivery); reload it`,
      'DISPENSATION_VERSION_CONFLICT',
    );
  }
}

export class WindowNotFoundError extends DomainError {
  readonly kind = 'not-found';

  constructor(id: string) {
    super(`Pharmacy window (location) ${id} not found or inactive`, 'WINDOW_NOT_FOUND');
  }
}

export class AlreadyDispensedError extends DomainError {
  readonly kind = 'conflict';

  constructor() {
    super('Everything prescribed was already delivered; no turn needed', 'ALREADY_DISPENSED');
  }
}

export class ProductNotFoundError extends DomainError {
  readonly kind = 'not-found';

  constructor(id: string) {
    super(`Product ${id} not found`, 'PRODUCT_NOT_FOUND');
  }
}

export class ProductTakenError extends DomainError {
  readonly kind = 'conflict';

  constructor(label: string) {
    super(`${label} is already in the catalog`, 'PRODUCT_TAKEN');
  }
}

export class StockChangedError extends DomainError {
  readonly kind = 'conflict';

  constructor(label: string) {
    super(`The stock of ${label} changed meanwhile (another delivery or receipt); try again`, 'STOCK_CHANGED');
  }
}
