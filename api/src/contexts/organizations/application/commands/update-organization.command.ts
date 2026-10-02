import { Clock } from '../../../../shared/application/index.js';
import { OrganizationName } from '../../domain/entities/organization-name.vo.js';
import { OrganizationVersionConflictError } from '../errors/organization.errors.js';
import { toOrganizationView } from '../mappings/organization-view.mapper.js';
import { OrganizationProvider } from '../ports/organization-provider.port.js';
import { OrganizationRepository } from '../ports/organization.repository.port.js';
import { OrganizationFinder } from '../services/organization-finder.service.js';
import {
  OrganizationView,
  UpdateOrganizationCommand,
} from '../types/organization.types.js';

/**
 * Updates the IPS's data. A new name is pushed to the provider first, so the
 * sign-in screens show the same name; if that fails nothing is saved.
 */
export class UpdateOrganization {
  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly finder: OrganizationFinder,
    private readonly provider: OrganizationProvider,
    private readonly clock: Clock,
  ) {}

  async execute(command: UpdateOrganizationCommand): Promise<OrganizationView> {
    const organization = await this.finder.getOrImport(command.teamId);
    const loadedVersion = organization.version;
    if (loadedVersion !== command.expectedVersion) {
      throw new OrganizationVersionConflictError(command.teamId);
    }

    const applied = organization.update(
      {
        name: command.name !== undefined ? OrganizationName.of(command.name) : undefined,
        profile: command.profile,
      },
      this.clock.now(),
    );
    if (applied.length === 0) return toOrganizationView(organization);

    if (applied.some((change) => change.field === 'name')) {
      await this.provider.rename(command.teamId, organization.name.value);
    }
    await this.organizations.save(organization, loadedVersion);
    return toOrganizationView(organization);
  }
}
