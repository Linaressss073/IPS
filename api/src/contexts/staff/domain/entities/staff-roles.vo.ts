import {
  InvalidValueError,
  ValueObject,
} from '../../../../shared/domain/index.js';
import { STAFF_ROLES } from '../constants/staff.constants.js';
import { StaffRole } from '../types/staff.types.js';

/** The set of roles a person holds in an IPS: no duplicates, stable order. */
export class StaffRoles extends ValueObject<StaffRole[]> {
  static of(raw: readonly string[]): StaffRoles {
    const roles = new Set<StaffRole>();
    for (const value of raw ?? []) {
      const role = value?.trim().toLowerCase() as StaffRole;
      if (!STAFF_ROLES.includes(role)) {
        throw new InvalidValueError(
          `Invalid role "${value}". Allowed: ${STAFF_ROLES.join(', ')}`,
        );
      }
      roles.add(role);
    }
    return new StaffRoles(STAFF_ROLES.filter((role) => roles.has(role)));
  }
}
