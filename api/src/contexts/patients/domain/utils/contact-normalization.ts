import { InvalidValueError } from '../../../../shared/domain/index.js';
import {
  EMAIL_MAX_LENGTH,
  EMAIL_PATTERN,
  PHONE_PATTERN,
} from '../constants/patient.constants.js';

/** Trimmed, lower-case e-mail; null when empty. Throws if malformed. */
export function normalizeEmail(raw: string | null | undefined): string | null {
  const email = (raw ?? '').trim().toLowerCase();
  if (!email) return null;
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    throw new InvalidValueError(`Invalid e-mail "${raw}"`);
  }
  return email;
}

/** Digits (and a leading "+") only; null when empty. Throws if malformed. */
export function normalizePhone(raw: string | null | undefined): string | null {
  const phone = (raw ?? '').replace(/[\s()-]/g, '');
  if (!phone) return null;
  if (!PHONE_PATTERN.test(phone)) {
    throw new InvalidValueError(
      'Phone must have 7-15 digits, optionally starting with "+"',
    );
  }
  return phone;
}
