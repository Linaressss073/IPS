/**
 * Base class for business rule violations. The presentation layer maps each
 * kind to an HTTP status, so the domain never knows about HTTP.
 */
export abstract class DomainError extends Error {
  abstract readonly kind: 'validation' | 'unauthorized' | 'not-found' | 'conflict' | 'forbidden';

  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidValueError extends DomainError {
  readonly kind = 'validation';

  constructor(message: string) {
    super(message, 'INVALID_VALUE');
  }
}
