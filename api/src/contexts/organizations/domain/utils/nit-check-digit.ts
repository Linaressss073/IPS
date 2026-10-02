import { NIT_WEIGHTS } from '../constants/organization.constants.js';

/**
 * DIAN check digit (dígito de verificación) of a NIT base: weighted sum of
 * the digits from right to left, modulo 11; 0 and 1 stay, others are 11 - r.
 * E.g. 890903938 -> 8.
 */
export function nitCheckDigit(base: string): number {
  let sum = 0;
  for (let i = 0; i < base.length; i++) {
    sum += Number(base[base.length - 1 - i]) * NIT_WEIGHTS[i];
  }
  const remainder = sum % 11;
  return remainder > 1 ? 11 - remainder : remainder;
}
