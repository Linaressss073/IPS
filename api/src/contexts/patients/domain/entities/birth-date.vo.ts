import {
  InvalidValueError,
  ValueObject,
} from '../../../../shared/domain/index.js';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A calendar date (YYYY-MM-DD) with no time or time zone. */
export class BirthDate extends ValueObject<string> {
  static of(raw: string): BirthDate {
    const value = raw?.trim() ?? '';
    const match = ISO_DATE.exec(value);
    const date = match ? new Date(`${value}T00:00:00Z`) : null;
    // Rejects impossible dates such as 2026-02-30 (Date would roll them over).
    if (!date || date.toISOString().slice(0, 10) !== value) {
      throw new InvalidValueError(
        `Invalid birth date "${raw}"; expected YYYY-MM-DD`,
      );
    }
    return new BirthDate(value);
  }

  /** Completed years at the given moment (UTC calendar). */
  ageAt(now: Date): number {
    const [year, month, day] = this._value.split('-').map(Number);
    let age = now.getUTCFullYear() - year;
    const beforeBirthday =
      now.getUTCMonth() + 1 < month ||
      (now.getUTCMonth() + 1 === month && now.getUTCDate() < day);
    if (beforeBirthday) age -= 1;
    return age;
  }

  isAfter(now: Date): boolean {
    return this._value > now.toISOString().slice(0, 10);
  }
}
