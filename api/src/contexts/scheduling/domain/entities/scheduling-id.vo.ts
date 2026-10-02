import {
  InvalidValueError,
  ValueObject,
  generateUuid,
  isUuid,
} from '../../../../shared/domain/index.js';

/** Identity (UUID) of a service, location, agenda or appointment. */
export class SchedulingId extends ValueObject<string> {
  static generate(): SchedulingId {
    return new SchedulingId(generateUuid());
  }

  static of(value: string, what = 'id'): SchedulingId {
    if (!isUuid(value ?? '')) {
      throw new InvalidValueError(`Invalid ${what}: "${value}"`);
    }
    return new SchedulingId(value.toLowerCase());
  }
}
