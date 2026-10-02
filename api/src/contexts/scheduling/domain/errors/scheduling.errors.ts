import { DomainError } from '../../../../shared/domain/index.js';

/** Invariants of the scheduling aggregates. */

export class InvalidAgendaError extends DomainError {
  readonly kind = 'validation';

  constructor(message: string) {
    super(message, 'INVALID_AGENDA');
  }
}

export class PastScheduleError extends DomainError {
  readonly kind = 'validation';

  constructor(what: string) {
    super(`${what} cannot be in the past`, 'SCHEDULE_IN_THE_PAST');
  }
}

export class SlotNotInAgendaError extends DomainError {
  readonly kind = 'validation';

  constructor(time: string) {
    super(`${time} is not a slot of this agenda`, 'SLOT_NOT_IN_AGENDA');
  }
}

export class InvalidAppointmentTransitionError extends DomainError {
  readonly kind = 'conflict';

  constructor(status: string, action: string) {
    super(`An appointment in status "${status}" cannot be ${action}`, 'INVALID_APPOINTMENT_TRANSITION');
  }
}

export class RescheduleServiceMismatchError extends DomainError {
  readonly kind = 'validation';

  constructor() {
    super('An appointment can only be moved to an agenda of the same service', 'RESCHEDULE_SERVICE_MISMATCH');
  }
}
