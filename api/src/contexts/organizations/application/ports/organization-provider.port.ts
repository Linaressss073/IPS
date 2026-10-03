import { TeamId } from '../../../../shared/domain/index.js';
import { ProviderOrganization } from '../types/organization.types.js';

/** Port: organizations in the identity provider (Clerk), the owner of access. */
export interface OrganizationProvider {
  /** Throws OrganizationNotFoundError if the provider does not have it. */
  get(id: TeamId): Promise<ProviderOrganization>;

  /** Keeps the provider's name equal to ours. */
  rename(id: TeamId, name: string): Promise<void>;

  /** Removes the organization and every membership: nobody can access it. */
  delete(id: TeamId): Promise<void>;

  list(): AsyncIterable<ProviderOrganization>;
}
