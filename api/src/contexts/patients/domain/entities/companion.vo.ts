import {
  InvalidValueError,
  normalizeEmail,
  normalizePhone,
  ValueObject,
} from '../../../../shared/domain/index.js';
import { RELATIONSHIPS } from '../constants/patient.constants.js';
import { CompanionData, Relationship } from '../types/patient.types.js';
import { IdentityDocument } from './identity-document.vo.js';
import { PersonName } from './person-name.vo.js';

/**
 * Someone who comes with the patient (a minor's guardian, a caregiver…).
 * Every field is optional, but there must be a name or a phone: otherwise
 * nobody could be identified or called.
 */
export class Companion extends ValueObject<CompanionData> {
  static of(input: {
    relationship?: string | null;
    name?: {
      firstName: string;
      middleName?: string | null;
      firstLastName: string;
      secondLastName?: string | null;
    } | null;
    document?: { type: string; number: string } | null;
    phone?: string | null;
    email?: string | null;
  }): Companion {
    const name = input.name ? PersonName.of(input.name) : null;
    const phone = normalizePhone(input.phone);
    if (!name && !phone) {
      throw new InvalidValueError('A companion needs at least a name or a phone');
    }

    const document = input.document
      ? IdentityDocument.of(input.document.type, input.document.number)
      : null;

    return new Companion({
      relationship: toRelationship(input.relationship),
      name: name?.value ?? null,
      document: document?.value ?? null,
      phone,
      email: normalizeEmail(input.email),
    });
  }
}

function toRelationship(raw: string | null | undefined): Relationship | null {
  const value = raw?.trim().toLowerCase();
  if (!value) return null;
  if (!RELATIONSHIPS.includes(value as Relationship)) {
    throw new InvalidValueError(
      `Invalid relationship "${raw}". Allowed: ${RELATIONSHIPS.join(', ')}`,
    );
  }
  return value as Relationship;
}
