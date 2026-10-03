import { DomainError } from '../../../../shared/domain/index.js';

export class ConsultationNotFoundError extends DomainError {
  readonly kind = 'not-found';

  constructor(id: string) {
    super(`Consultation ${id} not found`, 'CONSULTATION_NOT_FOUND');
  }
}

export class PrescriptionNotFoundError extends DomainError {
  readonly kind = 'not-found';

  constructor(consultationId: string) {
    super(`No signed prescription for consultation ${consultationId}`, 'PRESCRIPTION_NOT_FOUND');
  }
}

export class ConsultationAlreadyStartedError extends DomainError {
  readonly kind = 'conflict';

  constructor() {
    super('The appointment already has a consultation', 'CONSULTATION_ALREADY_STARTED');
  }
}

export class ConsultationVersionConflictError extends DomainError {
  readonly kind = 'conflict';

  constructor(id: string) {
    super(`Consultation ${id} changed since it was read; reload it`, 'CONSULTATION_VERSION_CONFLICT');
  }
}
