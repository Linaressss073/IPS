import { InvalidValueError, ValueObject } from '../../../../shared/domain/index.js';
import {
  ANNOUNCE_INTERVAL_LIMITS,
  DEFAULT_ANNOUNCE_INTERVAL_SECONDS,
  DEFAULT_MAX_CALLS,
  MAX_CALLS_LIMITS,
} from '../constants/admission.constants.js';

export interface CallSettingsProps {
  /** Seconds between automatic re-announcements of a called turn. */
  announceIntervalSeconds: number;
  /** Calls before the turn is closed as "no se presentó". */
  maxCalls: number;
}

/** How each IPS calls turns (agreed default: 3 calls, every 2 minutes). */
export class CallSettings extends ValueObject<CallSettingsProps> {
  static readonly DEFAULT = new CallSettings({
    announceIntervalSeconds: DEFAULT_ANNOUNCE_INTERVAL_SECONDS,
    maxCalls: DEFAULT_MAX_CALLS,
  });

  static of(input: CallSettingsProps): CallSettings {
    const { announceIntervalSeconds, maxCalls } = input;
    if (
      !Number.isInteger(announceIntervalSeconds) ||
      announceIntervalSeconds < ANNOUNCE_INTERVAL_LIMITS.min ||
      announceIntervalSeconds > ANNOUNCE_INTERVAL_LIMITS.max
    ) {
      throw new InvalidValueError(
        `announceIntervalSeconds must be a whole number from ${ANNOUNCE_INTERVAL_LIMITS.min} to ${ANNOUNCE_INTERVAL_LIMITS.max}`,
      );
    }
    if (!Number.isInteger(maxCalls) || maxCalls < MAX_CALLS_LIMITS.min || maxCalls > MAX_CALLS_LIMITS.max) {
      throw new InvalidValueError(
        `maxCalls must be a whole number from ${MAX_CALLS_LIMITS.min} to ${MAX_CALLS_LIMITS.max}`,
      );
    }
    return new CallSettings({ announceIntervalSeconds, maxCalls });
  }

  get intervalMs(): number {
    return this.value.announceIntervalSeconds * 1000;
  }
}
