import { InvalidValueError, TeamId } from '../../../../shared/domain/index.js';
import { NothingPendingError, OverDeliveryError } from '../errors/pharmacy.errors.js';
import { Dispensation } from './dispensation.entity.js';

const now = new Date('2026-10-05T15:00:00Z');
const allocate = () => ({ productId: 'prod', lots: [] });
const open = () =>
  Dispensation.open({
    teamId: TeamId.of('org_2xTeamA9fKq4LmN8pRsT1uVwY'),
    consultationId: 'c1',
    patientId: 'p1',
    prescribed: [
      { medication: 'Acetaminofén 500 mg', presentation: 'Tableta', dose: '1', route: 'oral', frequency: 'c/8h', durationDays: 5, prescribed: 15 },
      { medication: 'Loratadina 10 mg', presentation: 'Tableta', dose: '1', route: 'oral', frequency: 'c/24h', durationDays: 10, prescribed: 10 },
    ],
    now,
  });

describe('Dispensation', () => {
  it('delivers in parts until everything prescribed is delivered', () => {
    const dispensation = open();
    expect(dispensation).toMatchObject({ status: 'pendiente', version: 0 });

    dispensation.deliver({ lines: [{ index: 0, quantity: 15 }, { index: 1, quantity: 4 }], note: 'Faltan 6 de loratadina', deliveredBy: 'u1', now, allocate });
    expect(dispensation).toMatchObject({ status: 'parcial', version: 1 });
    expect(dispensation.items.map((i) => i.delivered)).toEqual([15, 4]);

    dispensation.deliver({ lines: [{ index: 1, quantity: 6 }], note: '', deliveredBy: 'u1', now, allocate });
    expect(dispensation).toMatchObject({ status: 'completa', version: 2 });
    expect(dispensation.deliveries).toHaveLength(2);
    expect(() => dispensation.deliver({ lines: [{ index: 0, quantity: 1 }], note: '', deliveredBy: 'u1', now, allocate })).toThrow(
      NothingPendingError,
    );
  });

  it('never delivers more than prescribed, nor nothing, nor unknown items', () => {
    const dispensation = open();
    const deliver = (lines: { index: number; quantity: number }[]) =>
      dispensation.deliver({ lines, note: '', deliveredBy: 'u1', now, allocate });
    expect(() => deliver([{ index: 0, quantity: 16 }])).toThrow(OverDeliveryError);
    expect(() => deliver([])).toThrow(InvalidValueError);
    expect(() => deliver([{ index: 0, quantity: 0 }])).toThrow(InvalidValueError);
    expect(() => deliver([{ index: 7, quantity: 1 }])).toThrow('no item 7');
    expect(() => deliver([{ index: 0, quantity: 1 }, { index: 0, quantity: 1 }])).toThrow('repeated');
    expect(dispensation.status).toBe('pendiente');
  });
});
