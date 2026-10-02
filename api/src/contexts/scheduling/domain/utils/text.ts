import { InvalidValueError } from '../../../../shared/domain/index.js';

/** Trimmed, single-spaced text of 1..max characters. */
export function requiredText(value: string, field: string, max: number, min = 1): string {
  const text = (value ?? '').trim().replace(/\s+/g, ' ');
  if (text.length < min || text.length > max) {
    throw new InvalidValueError(`${field} must have between ${min} and ${max} characters`);
  }
  return text;
}
