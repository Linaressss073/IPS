import { TeamId } from '../../../../shared/domain/index.js';
import { ProviderOrganization } from '../types/organization.types.js';

/** Port: organizations in the identity provider (Clerk), the owner of access. */
export interface OrganizationProvider {
  find(id: TeamId): Promise<ProviderOrganization | null>;

  /** Keeps the provider's name equal to ours. */
  rename(id: TeamId, name: string): Promise<void>;

  /** Removes the organization and every membership: nobody can access it. */
  delete(id: TeamId): Promise<void>;

  list(): AsyncIterable<ProviderOrganization>;
}
