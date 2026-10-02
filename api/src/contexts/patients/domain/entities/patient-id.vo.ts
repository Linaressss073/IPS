import {
  InvalidValueError,
  ValueObject,
  generateUuid,
  isUuid,
} from '../../../../shared/domain/index.js';

/** Internal identity of a patient within the system (UUID). */
export class PatientId extends ValueObject<string> {
  static generate(): PatientId {
    return new PatientId(generateUuid());
  }

  static of(value: string): PatientId {
    if (!isUuid(value)) {
      throw new InvalidValueError(`Invalid patient id: "${value}"`);
    }
    return new PatientId(value.toLowerCase());
  }
}
