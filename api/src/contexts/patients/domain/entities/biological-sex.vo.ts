import {
  InvalidValueError,
  ValueObject,
} from '../../../../shared/domain/index.js';
import { SEXES } from '../constants/patient.constants.js';
import { Sex } from '../types/patient.types.js';

/** H (hombre), M (mujer) or I (indeterminado), as reported in RIPS. */
export class BiologicalSex extends ValueObject<Sex> {
  static of(raw: string): BiologicalSex {
    const value = raw?.trim().toUpperCase() as Sex;
    if (!SEXES.includes(value)) {
      throw new InvalidValueError(
        `Invalid sex "${raw}". Allowed: ${SEXES.join(', ')}`,
      );
    }
    return new BiologicalSex(value);
  }
}
