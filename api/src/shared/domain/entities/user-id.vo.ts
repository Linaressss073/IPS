import { InvalidValueError } from '../errors/domain-error.js';
import { ValueObject } from './value-object.js';

/** A user as identified by the identity provider (JWT `sub`). */
export class UserId extends ValueObject<string> {
  static of(value: string): UserId {
    if (!value?.trim()) {
      throw new InvalidValueError('User id cannot be empty');
    }
    return new UserId(value);
  }
}
