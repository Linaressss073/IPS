import { TeamId } from '../../../../shared/domain/index.js';
import { toOrganizationView } from '../mappings/organization-view.mapper.js';
import { OrganizationFinder } from '../services/organization-finder.service.js';
import { OrganizationView } from '../types/organization.types.js';

/** The IPS's data from the `organizations` collection. */
export class GetOrganization {
  constructor(private readonly finder: OrganizationFinder) {}

  async execute(query: { teamId: TeamId }): Promise<OrganizationView> {
    return toOrganizationView(await this.finder.getOrImport(query.teamId));
  }
}
