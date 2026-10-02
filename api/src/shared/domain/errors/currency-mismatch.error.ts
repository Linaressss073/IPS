import { DomainError } from './domain-error.js';

export class CurrencyMismatchError extends DomainError {
  readonly kind = 'conflict';

  constructor(expected: string, actual: string) {
    super(
      `Cannot combine amounts in ${expected} and ${actual}`,
      'CURRENCY_MISMATCH',
    );
  }
}
