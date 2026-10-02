import { CurrencyMismatchError } from '../errors/currency-mismatch.error.js';
import { Money } from './money.vo.js';

describe('Money', () => {
  it('adds amounts of the same currency', () => {
    expect(Money.of(150, 'usd').add(Money.of(50, 'USD'))).toEqual(
      Money.of(200, 'USD'),
    );
  });

  it('refuses to add different currencies', () => {
    expect(() => Money.of(1, 'USD').add(Money.of(1, 'EUR'))).toThrow(
      CurrencyMismatchError,
    );
  });

  it('multiplies by a quantity', () => {
    expect(Money.of(4990, 'COP').multiply(3).amountInCents).toBe(14970);
  });
});
