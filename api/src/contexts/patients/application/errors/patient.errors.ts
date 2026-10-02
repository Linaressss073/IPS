import { DomainError } from '../../../../shared/domain/index.js';
export { RequesterNotATeamMemberError } from '../../../../shared/application/index.js';
import { IdentityDocument } from '../../domain/entities/identity-document.vo.js';
import { PatientId } from '../../domain/entities/patient-id.vo.js';

/** Rules that need the repository or other ports, checked by the application. */

export class PatientNotFoundError extends DomainError {
  readonly kind = 'not-found';

  constructor(id: PatientId) {
    super(`Patient ${id.value} not found`, 'PATIENT_NOT_FOUND');
  }
}

export class DocumentAlreadyRegisteredError extends DomainError {
  readonly kind = 'conflict';

  constructor(document: IdentityDocument) {
    super(
      `A patient with document ${document.toString()} is already registered`,
      'DOCUMENT_ALREADY_REGISTERED',
    );
  }
}

export class PatientVersionConflictError extends DomainError {
  readonly kind = 'conflict';

  constructor(id: PatientId) {
    super(
      `Patient ${id.value} was modified by someone else; reload it and try again`,
      'PATIENT_VERSION_CONFLICT',
    );
  }
}
