import {
  InvalidValueError,
  ValueObject,
} from '../../../../shared/domain/index.js';
import {
  ORGANIZATION_NAME_MAX_LENGTH,
  ORGANIZATION_NAME_MIN_LENGTH,
} from '../constants/organization.constants.js';

/** Name of the IPS, kept identical to the organization's name in the provider. */
export class OrganizationName extends ValueObject<string> {
  static of(raw: string): OrganizationName {
    const value = (raw ?? '').trim().replace(/\s+/g, ' ');
    if (
      value.length < ORGANIZATION_NAME_MIN_LENGTH ||
      value.length > ORGANIZATION_NAME_MAX_LENGTH
    ) {
      throw new InvalidValueError(
        `Organization name must be ${ORGANIZATION_NAME_MIN_LENGTH}-${ORGANIZATION_NAME_MAX_LENGTH} characters`,
      );
    }
    return new OrganizationName(value);
  }
}
