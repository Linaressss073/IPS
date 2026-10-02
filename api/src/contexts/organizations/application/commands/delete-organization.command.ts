import { Clock } from '../../../../shared/application/index.js';
import { OrganizationProvider } from '../ports/organization-provider.port.js';
import { OrganizationRepository } from '../ports/organization.repository.port.js';
import { OrganizationFinder } from '../services/organization-finder.service.js';
import { DeleteOrganizationCommand } from '../types/organization.types.js';

/**
 * Deletes the IPS: the provider removes the organization and every
 * membership (nobody can access it anymore) and we keep a tombstone with who
 * did it. Patients and their timeline are NOT deleted: clinical records must
 * be retained by law.
 */
export class DeleteOrganization {
  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly finder: OrganizationFinder,
    private readonly provider: OrganizationProvider,
    private readonly clock: Clock,
  ) {}

  async execute(command: DeleteOrganizationCommand): Promise<void> {
    const organization = await this.finder.getOrImport(command.teamId);
    const loadedVersion = organization.version;
    organization.delete(command.deletedBy, this.clock.now());

    // Access first: if the provider fails, nothing changed.
    await this.provider.delete(command.teamId);
    await this.organizations.save(organization, loadedVersion);
  }
}
