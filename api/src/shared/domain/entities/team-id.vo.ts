import { InvalidValueError } from '../errors/domain-error.js';
import { isUuid } from '../utils/uuid.js';
import { ValueObject } from './value-object.js';

/**
 * The tenant. A Team (organization) owns all business data; every bounded
 * context scopes its aggregates by TeamId. Its identity comes from the
 * identity provider (Hexclave), which is why it lives in the shared kernel.
 */
export class TeamId extends ValueObject<string> {
  static of(value: string): TeamId {
    if (!isUuid(value)) {
      throw new InvalidValueError(`Invalid team id: "${value}"`);
    }
    return new TeamId(value.toLowerCase());
  }
}
