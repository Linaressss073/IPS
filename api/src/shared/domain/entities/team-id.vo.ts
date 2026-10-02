import { InvalidValueError } from '../errors/domain-error.js';
import { ValueObject } from './value-object.js';

/** Identity-provider ids such as Clerk's "org_2abc…" (case-sensitive). */
const TEAM_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * The tenant: a team (IPS) owns all business data; every bounded context
 * scopes its aggregates by TeamId. Its identity comes from the identity
 * provider (a Clerk organization), which is why it lives in the shared kernel.
 */
export class TeamId extends ValueObject<string> {
  static of(value: string): TeamId {
    if (!TEAM_ID_PATTERN.test(value ?? '')) {
      throw new InvalidValueError(`Invalid team id: "${value}"`);
    }
    return new TeamId(value);
  }
}
