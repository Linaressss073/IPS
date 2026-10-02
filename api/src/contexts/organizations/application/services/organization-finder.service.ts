import { Clock } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import { OrganizationName } from '../../domain/entities/organization-name.vo.js';
import { Organization } from '../../domain/entities/organization.entity.js';
import {
  OrganizationAlreadyStoredError,
  OrganizationNotFoundError,
} from '../errors/organization.errors.js';
import { OrganizationProvider } from '../ports/organization-provider.port.js';
import { OrganizationRepository } from '../ports/organization.repository.port.js';

/**
 * Loads an active organization. If it is not in our store yet (webhooks not
 * set up, or it predates them), it is imported from the provider once.
 */
export class OrganizationFinder {
  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly provider: OrganizationProvider,
    private readonly clock: Clock,
  ) {}

  async getOrImport(id: TeamId): Promise<Organization> {
    const stored = await this.organizations.findById(id);
    if (stored) {
      if (stored.isDeleted) throw new OrganizationNotFoundError(id);
      return stored;
    }

    const fromProvider = await this.provider.find(id);
    if (!fromProvider) throw new OrganizationNotFoundError(id);
    const organization = Organization.importFromProvider({
      id,
      name: OrganizationName.of(fromProvider.name),
      providerUpdatedAt: fromProvider.updatedAt,
      now: this.clock.now(),
    });
    try {
      await this.organizations.insert(organization);
      return organization;
    } catch (error) {
      if (!(error instanceof OrganizationAlreadyStoredError)) throw error;
      return this.getOrImport(id);
    }
  }
}
