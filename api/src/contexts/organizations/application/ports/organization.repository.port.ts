import { TeamId } from '../../../../shared/domain/index.js';
import { Organization } from '../../domain/entities/organization.entity.js';

/** Port: the `organizations` document store (MongoDB). */
export interface OrganizationRepository {
  exists(id: TeamId): Promise<boolean>;

  /** Also deleted ones (tombstones); throws OrganizationNotFoundError if never stored. */
  getById(id: TeamId): Promise<Organization>;

  /** Throws OrganizationAlreadyStoredError if another request stored it first. */
  insert(organization: Organization): Promise<void>;

  /**
   * Saves an organization loaded at `expectedVersion`. Throws
   * OrganizationVersionConflictError if someone else saved it in between.
   */
  save(organization: Organization, expectedVersion: number): Promise<void>;

  /** Organizations not deleted, with the date the provider last changed them. */
  listActive(): Promise<{ id: TeamId; providerUpdatedAt: Date }[]>;
}
