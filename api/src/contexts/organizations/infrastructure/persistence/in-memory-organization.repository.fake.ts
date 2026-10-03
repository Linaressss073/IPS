import { TeamId } from '../../../../shared/domain/index.js';
import {
  OrganizationAlreadyStoredError,
  OrganizationVersionConflictError,
} from '../../application/errors/organization.errors.js';
import { OrganizationRepository } from '../../application/ports/organization.repository.port.js';
import { Organization } from '../../domain/entities/organization.entity.js';

/** Test double for the OrganizationRepository port (stores snapshots). */
export class InMemoryOrganizationRepository implements OrganizationRepository {
  private readonly items = new Map<string, Organization>();

  async findById(id: TeamId): Promise<Organization | null> {
    const stored = this.items.get(id.value);
    return stored ? clone(stored) : null;
  }

  async insert(organization: Organization): Promise<void> {
    if (this.items.has(organization.id.value)) {
      throw new OrganizationAlreadyStoredError(organization.id);
    }
    this.items.set(organization.id.value, clone(organization));
  }

  async save(organization: Organization, expectedVersion: number): Promise<void> {
    if (this.items.get(organization.id.value)?.version !== expectedVersion) {
      throw new OrganizationVersionConflictError(organization.id);
    }
    this.items.set(organization.id.value, clone(organization));
  }

  async listActive(): Promise<{ id: TeamId; providerUpdatedAt: Date }[]> {
    return [...this.items.values()]
      .filter((organization) => !organization.isDeleted)
      .map((organization) => ({ id: organization.id, providerUpdatedAt: organization.providerUpdatedAt }));
  }
}

function clone(organization: Organization): Organization {
  return Organization.restore(organization.id, {
    name: organization.name,
    profile: organization.profile,
    status: organization.status,
    providerUpdatedAt: organization.providerUpdatedAt,
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt,
    version: organization.version,
    deletedAt: organization.deletedAt,
    deletedBy: organization.deletedBy,
  });
}
