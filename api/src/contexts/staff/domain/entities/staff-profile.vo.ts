import {
  InvalidValueError,
  ValueObject,
} from '../../../../shared/domain/index.js';
import { DISPLAY_NAME_MAX_LENGTH } from '../constants/staff.constants.js';
import { StaffProfileProps } from '../types/staff.types.js';
import { maskEmail } from '../utils/mask-email.js';

/**
 * A staff member as we store them: a display name and a masked e-mail,
 * nothing else from the identity provider (no full e-mail, phone or photo).
 */
export class StaffProfile extends ValueObject<StaffProfileProps> {
  static of(input: {
    userId: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    email?: string | null;
    sourceUpdatedAt: Date;
  }): StaffProfile {
    if (!input.userId?.trim()) {
      throw new InvalidValueError('A staff profile needs a user id');
    }
    const fullName = [input.firstName, input.lastName]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(' ');
    const displayName =
      (fullName || input.username?.trim() || '').slice(0, DISPLAY_NAME_MAX_LENGTH) ||
      null;

    return new StaffProfile({
      userId: input.userId,
      displayName,
      emailMasked: maskEmail(input.email),
      sourceUpdatedAt: input.sourceUpdatedAt,
    });
  }

  get userId(): string {
    return this._value.userId;
  }

  get displayName(): string | null {
    return this._value.displayName;
  }

  get emailMasked(): string | null {
    return this._value.emailMasked;
  }

  get sourceUpdatedAt(): Date {
    return this._value.sourceUpdatedAt;
  }
}
