import { DomainError } from '../../../../shared/domain/index.js';

export class InvalidAccessTokenError extends DomainError {
  readonly kind = 'unauthorized';

  constructor() {
    super('Invalid or expired token', 'INVALID_ACCESS_TOKEN');
  }
}
