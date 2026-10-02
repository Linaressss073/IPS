import { DomainError } from '../../../../shared/domain/index.js';

/** Rules that need the repositories or other contexts, checked by the application. */

export class SchedulingNotFoundError extends DomainError {
  readonly kind = 'not-found';

  constructor(what: 'SERVICE' | 'LOCATION' | 'AGENDA' | 'APPOINTMENT' | 'PATIENT', id: string) {
    super(`${what.toLowerCase()} ${id} not found`, `${what}_NOT_FOUND`);
  }
}

export class ServiceCodeTakenError extends DomainError {
  readonly kind = 'conflict';

  constructor(code: string) {
    super(`Another service already uses the code ${code}`, 'SERVICE_CODE_TAKEN');
  }
}

export class LocationTakenError extends DomainError {
  readonly kind = 'conflict';

  constructor(label: string) {
    super(`${label} already exists`, 'LOCATION_TAKEN');
  }
}

export class InactiveResourceError extends DomainError {
  readonly kind = 'validation';

  constructor(what: string) {
    super(`The ${what} is inactive`, 'INACTIVE_RESOURCE');
  }
}

export class NotAProfessionalError extends DomainError {
  readonly kind = 'validation';

  constructor(userId: string) {
    super(`${userId} does not have the "medico" role in this IPS`, 'NOT_A_PROFESSIONAL');
  }
}

export class AgendaOverlapError extends DomainError {
  readonly kind = 'conflict';

  constructor(who: 'professional' | 'location') {
    super(`The ${who} already has an agenda overlapping that time`, 'AGENDA_OVERLAP');
  }
}

export class AgendaHasAppointmentsError extends DomainError {
  readonly kind = 'conflict';

  constructor() {
    super('The agenda has active appointments; cancel or move them first', 'AGENDA_HAS_APPOINTMENTS');
  }
}

export class SlotTakenError extends DomainError {
  readonly kind = 'conflict';

  constructor() {
    super('That slot is already taken', 'SLOT_TAKEN');
  }
}

export class PatientAlreadyBookedError extends DomainError {
  readonly kind = 'conflict';

  constructor() {
    super('The patient already has an appointment at that time', 'PATIENT_ALREADY_BOOKED');
  }
}

export class AppointmentVersionConflictError extends DomainError {
  readonly kind = 'conflict';

  constructor(id: string) {
    super(
      `Appointment ${id} was modified by someone else; reload it and try again`,
      'APPOINTMENT_VERSION_CONFLICT',
    );
  }
}
