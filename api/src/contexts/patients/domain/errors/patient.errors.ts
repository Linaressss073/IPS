import { DomainError } from '../../../../shared/domain/index.js';
import { MAX_AGE_YEARS } from '../constants/patient.constants.js';

/** Invariant violations raised by the Patient aggregate itself. */

export class BirthDateOutOfRangeError extends DomainError {
  readonly kind = 'validation';

  constructor(birthDate: string) {
    super(
      `Birth date ${birthDate} must not be in the future nor more than ${MAX_AGE_YEARS} years ago`,
      'INVALID_BIRTH_DATE',
    );
  }
}
