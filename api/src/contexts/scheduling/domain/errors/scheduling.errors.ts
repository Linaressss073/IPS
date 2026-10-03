import { DomainError } from '../../../../shared/domain/index.js';

/** Invariants of the scheduling aggregates. */

/**
 * The agenda's hours are not usable. `code` says which rule failed so the
 * client can explain it: INVALID_SLOT_MINUTES, AGENDA_END_BEFORE_START or
 * AGENDA_SLOTS_NOT_WHOLE.
 */
export class InvalidAgendaError extends DomainError {
  readonly kind = 'validation';

  constructor(
    code: 'INVALID_SLOT_MINUTES' | 'AGENDA_END_BEFORE_START' | 'AGENDA_SLOTS_NOT_WHOLE',
    message: string,
  ) {
    super(message, code);
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
