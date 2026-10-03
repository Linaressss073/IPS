import { InvalidValueError, TeamId } from '../../../../shared/domain/index.js';
import {
  ExpiredLotError,
  InactiveProductError,
  InsufficientStockError,
  LotExpiryMismatchError,
  NegativeStockError,
} from '../errors/pharmacy.errors.js';
import { Product } from './product.entity.js';

const now = new Date('2026-10-05T15:00:00Z');
const today = '2026-10-05';
const product = () =>
  Product.create({
    teamId: TeamId.of('org_2xTeamA9fKq4LmN8pRsT1uVwY'),
    name: ' Ibuprofeno  400 mg ',
    presentation: 'Tableta',
    minStock: 5,
    now,
  });

describe('Product', () => {
  it('takes stock first from the lot expiring first', () => {
    const p = product();
    expect(p.name).toBe('Ibuprofeno 400 mg');
    p.receive({ lotNumber: 'late', expiresOn: '2027-06-01', quantity: 10, today, now });
    p.receive({ lotNumber: 'SOON', expiresOn: '2026-11-01', quantity: 3, today, now });
    p.receive({ lotNumber: 'SOON', expiresOn: '2026-11-01', quantity: 2, today, now });
    expect(p.available(today)).toBe(15);

    expect(p.take(7, today, now)).toEqual([
      { lotNumber: 'SOON', expiresOn: '2026-11-01', quantity: 5 },
      { lotNumber: 'LATE', expiresOn: '2027-06-01', quantity: 2 },
    ]);
    expect(() => p.take(9, today, now)).toThrow(InsufficientStockError);
    expect(p.available(today)).toBe(8);
  });

  it('never dispenses expired units, and counts them apart', () => {
    const p = product();
    p.receive({ lotNumber: 'A', expiresOn: '2026-10-10', quantity: 4, today, now });
    expect(p.available('2026-10-11')).toBe(0);
    expect(p.expired('2026-10-11')).toBe(4);
    expect(() => p.take(1, '2026-10-11', now)).toThrow(InsufficientStockError);
  });

  it('rejects expired lots, mismatched expiries and bad quantities on receipt', () => {
    const p = product();
    expect(() => p.receive({ lotNumber: 'X', expiresOn: '2026-10-04', quantity: 1, today, now })).toThrow(ExpiredLotError);
    p.receive({ lotNumber: 'X', expiresOn: '2026-12-01', quantity: 1, today, now });
    expect(() => p.receive({ lotNumber: 'x', expiresOn: '2026-12-02', quantity: 1, today, now })).toThrow(
      LotExpiryMismatchError,
    );
    expect(() => p.receive({ lotNumber: 'Y', expiresOn: '2026-12-01', quantity: 0, today, now })).toThrow(InvalidValueError);
    expect(() => p.receive({ lotNumber: 'lote 1', expiresOn: '2026-12-01', quantity: 1, today, now })).toThrow(
      InvalidValueError,
    );
  });

  it('adjusts with a reason, never below zero', () => {
    const p = product();
    p.receive({ lotNumber: 'A', expiresOn: '2026-12-01', quantity: 4, today, now });
    expect(() => p.adjust({ lotNumber: 'A', quantity: -5, reason: 'Conteo', now })).toThrow(NegativeStockError);
    expect(() => p.adjust({ lotNumber: 'A', quantity: -1, reason: 'x', now })).toThrow(InvalidValueError);
    p.adjust({ lotNumber: 'a', quantity: -1, reason: 'Dañado', now });
    expect(p.available(today)).toBe(3);
  });

  it('does not dispense an inactive product', () => {
    const p = product();
    p.receive({ lotNumber: 'A', expiresOn: '2026-12-01', quantity: 4, today, now });
    p.update({ active: false }, now);
    expect(() => p.take(1, today, now)).toThrow(InactiveProductError);
  });
});
