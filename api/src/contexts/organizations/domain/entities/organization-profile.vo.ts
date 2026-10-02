import {
  InvalidValueError,
  normalizeEmail,
  normalizePhone,
  ValueObject,
} from '../../../../shared/domain/index.js';
import {
  ADDRESS_MAX_LENGTH,
  HABILITATION_CODE_PATTERN,
  NIT_PATTERN,
  PLACE_NAME_MAX_LENGTH,
} from '../constants/organization.constants.js';
import { OrganizationProfileProps } from '../types/organization.types.js';
import { nitCheckDigit } from '../utils/nit-check-digit.js';

export type OrganizationProfileInput = {
  [K in keyof OrganizationProfileProps]?: string | null;
};

/** IPS business data; every field optional, each one validated when given. */
export class OrganizationProfile extends ValueObject<OrganizationProfileProps> {
  static empty(): OrganizationProfile {
    return OrganizationProfile.of({});
  }

  static of(input: OrganizationProfileInput): OrganizationProfile {
    return new OrganizationProfile({
      nit: toNit(input.nit),
      habilitationCode: toHabilitationCode(input.habilitationCode),
      address: toText(input.address, ADDRESS_MAX_LENGTH, 'Address'),
      city: toText(input.city, PLACE_NAME_MAX_LENGTH, 'City'),
      department: toText(input.department, PLACE_NAME_MAX_LENGTH, 'Department'),
      phone: normalizePhone(input.phone),
      email: normalizeEmail(input.email),
    });
  }

  /** The fields present in `changes` replace the current ones (null clears). */
  with(changes: OrganizationProfileInput): OrganizationProfile {
    const merged: OrganizationProfileInput = { ...this._value };
    for (const [key, value] of Object.entries(changes)) {
      if (value !== undefined) {
        merged[key as keyof OrganizationProfileProps] = value;
      }
    }
    return OrganizationProfile.of(merged);
  }
}

/** Accepts "900.123.456-8" or "900123456-8"; the check digit must match. */
function toNit(raw: string | null | undefined): string | null {
  const value = (raw ?? '').replace(/[\s.]/g, '');
  if (!value) return null;
  const match = NIT_PATTERN.exec(value);
  if (!match) {
    throw new InvalidValueError(
      'NIT must be its digits and check digit, e.g. 900123456-8',
    );
  }
  if (nitCheckDigit(match[1]) !== Number(match[2])) {
    throw new InvalidValueError(`NIT ${value} has a wrong check digit`);
  }
  return value;
}

function toHabilitationCode(raw: string | null | undefined): string | null {
  const value = (raw ?? '').replace(/[\s-]/g, '');
  if (!value) return null;
  if (!HABILITATION_CODE_PATTERN.test(value)) {
    throw new InvalidValueError('Habilitation code must have 10-12 digits');
  }
  return value;
}

function toText(
  raw: string | null | undefined,
  maxLength: number,
  label: string,
): string | null {
  const value = (raw ?? '').trim().replace(/\s+/g, ' ');
  if (!value) return null;
  if (value.length > maxLength) {
    throw new InvalidValueError(`${label} must be at most ${maxLength} characters`);
  }
  return value;
}
