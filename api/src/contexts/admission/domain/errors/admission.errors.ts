import { DomainError } from '../../../../shared/domain/index.js';

export class NotTodayError extends DomainError {
  readonly kind = 'validation';

  constructor(date: string) {
    super(`Only today's appointments can check in (this one is on ${date})`, 'APPOINTMENT_NOT_TODAY');
  }
}

export class AppointmentNotAdmissibleError extends DomainError {
  readonly kind = 'conflict';

  constructor(status: string) {
    super(`An appointment in status "${status}" cannot check in`, 'APPOINTMENT_NOT_ADMISSIBLE');
  }
}

export class InvalidTurnTransitionError extends DomainError {
  readonly kind = 'conflict';

  constructor(status: string, action: string) {
    super(`A turn in status "${status}" cannot be ${action}`, 'INVALID_TURN_TRANSITION');
  }
}

export class MaxCallsReachedError extends DomainError {
  readonly kind = 'conflict';

  constructor(maxCalls: number) {
    super(`The turn was already called ${maxCalls} times`, 'MAX_CALLS_REACHED');
  }
}
