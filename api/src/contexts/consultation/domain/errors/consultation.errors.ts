import { DomainError } from '../../../../shared/domain/index.js';

export class NotTheTreatingPhysicianError extends DomainError {
  readonly kind = 'forbidden';

  constructor() {
    super('Only the physician of the appointment can write this consultation', 'NOT_THE_TREATING_PHYSICIAN');
  }
}

export class AppointmentNotAttendableError extends DomainError {
  readonly kind = 'conflict';

  constructor(reason: string) {
    super(`The appointment cannot be attended: ${reason}`, 'APPOINTMENT_NOT_ATTENDABLE');
  }
}

export class ConsultationSignedError extends DomainError {
  readonly kind = 'conflict';

  constructor() {
    super('A signed consultation cannot change; add an addendum instead', 'CONSULTATION_SIGNED');
  }
}

export class ConsultationNotSignedError extends DomainError {
  readonly kind = 'conflict';

  constructor() {
    super('Addenda go on signed consultations; edit the draft instead', 'CONSULTATION_NOT_SIGNED');
  }
}

export class IncompleteConsultationError extends DomainError {
  readonly kind = 'validation';

  constructor(missing: string[]) {
    super(`To sign, fill in: ${missing.join(', ')}`, 'CONSULTATION_INCOMPLETE');
  }
}
