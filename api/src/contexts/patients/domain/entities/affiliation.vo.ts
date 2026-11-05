import {
  InvalidValueError,
  ValueObject,
} from '../../../../shared/domain/index.js';
import { EPS_MAX_LENGTH, REGIMES } from '../constants/patient.constants.js';
import { Regime } from '../types/patient.types.js';

/**
 * Health insurance of the patient (not the IPS's): the regime and, optionally, the
 * patient's EPS. A "particular" patient pays directly and has no EPS; for the other
 * regimes the EPS may be left empty and filled in later.
 */
export class Affiliation extends ValueObject<{
  eps: string | null;
  regime: Regime;
}> {
  static of(input: { eps?: string | null; regime: string }): Affiliation {
    const regime = input.regime?.trim().toLowerCase() as Regime;
    if (!REGIMES.includes(regime)) {
      throw new InvalidValueError(
        `Invalid regime "${input.regime}". Allowed: ${REGIMES.join(', ')}`,
      );
    }

    const eps = (input.eps ?? '').trim().replace(/\s+/g, ' ') || null;
    if (regime === 'particular' && eps) {
      throw new InvalidValueError('A "particular" patient has no EPS');
    }
    if (eps && eps.length > EPS_MAX_LENGTH) {
      throw new InvalidValueError(
        `EPS must be at most ${EPS_MAX_LENGTH} characters`,
      );
    }
    return new Affiliation({ eps, regime });
  }

  get eps(): string | null {
    return this._value.eps;
  }

  get regime(): Regime {
    return this._value.regime;
  }
}
