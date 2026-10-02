import {
  InvalidValueError,
  ValueObject,
} from '../../../../shared/domain/index.js';
import {
  NAME_MAX_LENGTH,
  NAME_PATTERN,
} from '../constants/patient.constants.js';

interface PersonNameProps {
  firstName: string;
  middleName: string | null;
  firstLastName: string;
  secondLastName: string | null;
}

/** Colombian full name: primer y segundo nombre, primer y segundo apellido. */
export class PersonName extends ValueObject<PersonNameProps> {
  static of(input: {
    firstName: string;
    middleName?: string | null;
    firstLastName: string;
    secondLastName?: string | null;
  }): PersonName {
    return new PersonName({
      firstName: required(input.firstName, 'First name'),
      middleName: optional(input.middleName, 'Middle name'),
      firstLastName: required(input.firstLastName, 'First last name'),
      secondLastName: optional(input.secondLastName, 'Second last name'),
    });
  }

  get firstName(): string {
    return this._value.firstName;
  }

  get middleName(): string | null {
    return this._value.middleName;
  }

  get firstLastName(): string {
    return this._value.firstLastName;
  }

  get secondLastName(): string | null {
    return this._value.secondLastName;
  }

  get fullName(): string {
    return [
      this.firstName,
      this.middleName,
      this.firstLastName,
      this.secondLastName,
    ]
      .filter(Boolean)
      .join(' ');
  }
}

function required(raw: string, label: string): string {
  const value = optional(raw, label);
  if (!value) throw new InvalidValueError(`${label} is required`);
  return value;
}

function optional(raw: string | null | undefined, label: string): string | null {
  const value = (raw ?? '').trim().replace(/\s+/g, ' ');
  if (!value) return null;
  if (value.length > NAME_MAX_LENGTH || !NAME_PATTERN.test(value)) {
    throw new InvalidValueError(
      `${label} must be up to ${NAME_MAX_LENGTH} letters, spaces, apostrophes or dashes`,
    );
  }
  return value;
}
