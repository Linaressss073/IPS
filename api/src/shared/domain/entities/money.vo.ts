import { CURRENCY_CODE_PATTERN } from '../constants/money.constants.js';
import { CurrencyMismatchError } from '../errors/currency-mismatch.error.js';
import { InvalidValueError } from '../errors/domain-error.js';
import { MoneyProps } from '../types/money.types.js';
import { ValueObject } from './value-object.js';

/**
 * An amount in the smallest currency unit (cents) to avoid floating point
 * errors, plus its ISO 4217 currency code. Shared by every context that
 * deals with prices (Catalog, Orders).
 */
export class Money extends ValueObject<MoneyProps> {
  static of(amountInCents: number, currency: string): Money {
    if (!Number.isSafeInteger(amountInCents) || amountInCents < 0) {
      throw new InvalidValueError(
        'Amount must be a non-negative integer number of cents',
      );
    }
    const code = currency?.trim().toUpperCase() ?? '';
    if (!CURRENCY_CODE_PATTERN.test(code)) {
      throw new InvalidValueError(`Invalid ISO 4217 currency: "${currency}"`);
    }
    return new Money({ amountInCents, currency: code });
  }

  static zero(currency: string): Money {
    return Money.of(0, currency);
  }

  get amountInCents(): number {
    return this._value.amountInCents;
  }

  get currency(): string {
    return this._value.currency;
  }

  add(other: Money): Money {
    if (other.currency !== this.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
    return Money.of(this.amountInCents + other.amountInCents, this.currency);
  }

  multiply(factor: number): Money {
    return Money.of(this.amountInCents * factor, this.currency);
  }
}
