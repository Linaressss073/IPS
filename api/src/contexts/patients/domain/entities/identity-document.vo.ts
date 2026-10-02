import {
  InvalidValueError,
  ValueObject,
} from '../../../../shared/domain/index.js';
import {
  DOCUMENT_NUMBER_PATTERN,
  DOCUMENT_TYPES,
  NUMERIC_DOCUMENT_TYPES,
} from '../constants/patient.constants.js';
import { DocumentType } from '../types/patient.types.js';

/**
 * A Colombian identity document, e.g. CC 1000123456. Type + number is
 * unique within a team (IPS); the number is stored without separators.
 */
export class IdentityDocument extends ValueObject<{
  type: DocumentType;
  number: string;
}> {
  static of(type: string, number: string): IdentityDocument {
    const docType = type?.trim().toUpperCase() as DocumentType;
    if (!DOCUMENT_TYPES.includes(docType)) {
      throw new InvalidValueError(
        `Invalid document type "${type}". Allowed: ${DOCUMENT_TYPES.join(', ')}`,
      );
    }

    const docNumber = (number ?? '').toUpperCase().replace(/[\s.-]/g, '');
    if (!DOCUMENT_NUMBER_PATTERN.test(docNumber)) {
      throw new InvalidValueError(
        'Document number must have 3-20 letters or digits',
      );
    }
    if (NUMERIC_DOCUMENT_TYPES.includes(docType) && !/^\d+$/.test(docNumber)) {
      throw new InvalidValueError(
        `A ${docType} number can only contain digits`,
      );
    }
    return new IdentityDocument({ type: docType, number: docNumber });
  }

  get type(): DocumentType {
    return this._value.type;
  }

  get number(): string {
    return this._value.number;
  }

  toString(): string {
    return `${this.type} ${this.number}`;
  }
}
