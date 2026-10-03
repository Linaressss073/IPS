import type { ClerkClient } from '@clerk/backend';
import { isClerkAPIResponseError } from '@clerk/backend/errors';
import { TeamId } from '../../../../../shared/domain/index.js';
import { OrganizationNotFoundError } from '../../../application/errors/organization.errors.js';
import { OrganizationProvider } from '../../../application/ports/organization-provider.port.js';
import { ProviderOrganization } from '../../../application/types/organization.types.js';

const PAGE_SIZE = 100;

/** Anti-corruption layer over Clerk's Organizations API. */
export class ClerkOrganizationProvider implements OrganizationProvider {
  constructor(private readonly clerk: ClerkClient) {}

  async get(id: TeamId): Promise<ProviderOrganization> {
    try {
      const organization = await this.clerk.organizations.getOrganization({
        organizationId: id.value,
      });
      return toProviderOrganization(organization);
    } catch (error) {
      if (isClerkAPIResponseError(error) && error.status === 404) {
        throw new OrganizationNotFoundError(id);
      }
      throw error;
    }
  }

  async rename(id: TeamId, name: string): Promise<void> {
    await this.clerk.organizations.updateOrganization(id.value, { name });
  }

  async delete(id: TeamId): Promise<void> {
    try {
      await this.clerk.organizations.deleteOrganization(id.value);
    } catch (error) {
      // Already gone: the goal (nobody can access it) is met.
      if (!(isClerkAPIResponseError(error) && error.status === 404)) throw error;
    }
  }

  async *list(): AsyncIterable<ProviderOrganization> {
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data } = await this.clerk.organizations.getOrganizationList({
        limit: PAGE_SIZE,
        offset,
      });
      yield* data.map(toProviderOrganization);
      if (data.length < PAGE_SIZE) return;
    }
  }
}

function toProviderOrganization(organization: {
  id: string;
  name: string;
  updatedAt: number;
}): ProviderOrganization {
  return {
    id: TeamId.of(organization.id),
    name: organization.name,
    updatedAt: new Date(organization.updatedAt),
  };
}
