import { ServiceUnavailableException } from '@nestjs/common';
import { OrganizationRepository } from '../../application/ports/organization.repository.port.js';

/** Used when MONGO_URL is not set: the organizations store lives in MongoDB. */
export class UnavailableOrganizationRepository implements OrganizationRepository {
  findById(): never {
    throw unavailable();
  }

  insert(): never {
    throw unavailable();
  }

  save(): never {
    throw unavailable();
  }
}

function unavailable(): ServiceUnavailableException {
  return new ServiceUnavailableException(
    'The organizations store needs MongoDB (MONGO_URL)',
  );
}
