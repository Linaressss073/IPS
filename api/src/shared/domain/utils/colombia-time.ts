import { InvalidValueError } from '../errors/domain-error.js';

/**
 * Agendas are kept in Colombia's local time (UTC-5 all year, no daylight
 * saving): a calendar date plus minutes from midnight. Instants (Date) are
 * derived from them for ordering and for "is it in the past?".
 */
const OFFSET_MS = 5 * 60 * 60 * 1000;
const MINUTES_PER_DAY = 24 * 60;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-4]):([0-5]\d)$/;

/** "2026-10-05" if it is a real calendar date. */
export function parseCalendarDate(value: string, field = 'date'): string {
  const text = value?.trim() ?? '';
  const parsed = new Date(`${text}T00:00:00Z`);
  if (!DATE_PATTERN.test(text) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) {
    throw new InvalidValueError(`${field} must be a real date as YYYY-MM-DD`);
  }
  return text;
}

/** "07:30" -> 450 (minutes from midnight, 00:00 to 24:00). */
export function parseTime(value: string, field = 'time'): number {
  const match = TIME_PATTERN.exec(value?.trim() ?? '');
  const minutes = match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
  if (!match || minutes > MINUTES_PER_DAY) {
    throw new InvalidValueError(`${field} must be a time as HH:MM (24 h)`);
  }
  return minutes;
}

/** 450 -> "07:30". */
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** The instant of a Colombian local date and time. */
export function colombiaInstant(date: string, minutes: number): Date {
  return new Date(Date.parse(`${date}T00:00:00Z`) + minutes * 60_000 + OFFSET_MS);
}

/** Today's date in Colombia at the given instant. */
export function colombiaDate(at: Date): string {
  return new Date(at.getTime() - OFFSET_MS).toISOString().slice(0, 10);
}

/** Minutes from midnight in Colombia at the given instant. */
export function colombiaMinute(at: Date): number {
  const local = new Date(at.getTime() - OFFSET_MS);
  return local.getUTCHours() * 60 + local.getUTCMinutes();
}
