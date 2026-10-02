import {
  InvalidValueError,
  normalizeEmail,
  normalizePhone,
  ValueObject,
} from '../../../../shared/domain/index.js';
import { ADDRESS_MAX_LENGTH } from '../constants/patient.constants.js';

interface ContactInfoProps {
  email: string;
  phone: string | null;
  address: string | null;
}

/**
 * How to reach the patient. The e-mail is required because it is how the
 * patient signs up; phone and address are optional.
 */
export class ContactInfo extends ValueObject<ContactInfoProps> {
  static of(input: {
    email: string;
    phone?: string | null;
    address?: string | null;
  }): ContactInfo {
    const email = normalizeEmail(input.email);
    if (!email) throw new InvalidValueError(`Invalid e-mail "${input.email}"`);

    const address = (input.address ?? '').trim().replace(/\s+/g, ' ') || null;
    if (address && address.length > ADDRESS_MAX_LENGTH) {
      throw new InvalidValueError(
        `Address must be at most ${ADDRESS_MAX_LENGTH} characters`,
      );
    }

    return new ContactInfo({
      email,
      phone: normalizePhone(input.phone),
      address,
    });
  }

  get email(): string {
    return this._value.email;
  }

  get phone(): string | null {
    return this._value.phone;
  }

  get address(): string | null {
    return this._value.address;
  }
}
