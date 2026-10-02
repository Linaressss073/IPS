import { InvalidValueError, ValueObject } from '../../../../shared/domain/index.js';
import { SERVICE_CODE_PATTERN } from '../constants/scheduling.constants.js';

/** Prefix of a service on the turn screen: "rth" -> "RTH" (2-4 letters). */
export class ServiceCode extends ValueObject<string> {
  static of(value: string): ServiceCode {
    const code = (value ?? '').trim().toUpperCase();
    if (!SERVICE_CODE_PATTERN.test(code)) {
      throw new InvalidValueError('code must be 2 to 4 letters (A-Z), e.g. "RTH"');
    }
    return new ServiceCode(code);
  }
}
