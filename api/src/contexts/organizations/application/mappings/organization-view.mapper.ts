import { Organization } from '../../domain/entities/organization.entity.js';
import { OrganizationView } from '../types/organization.types.js';

export function toOrganizationView(organization: Organization): OrganizationView {
  return {
    id: organization.id.value,
    name: organization.name.value,
    ...organization.profile.value,
    status: organization.status,
    version: organization.version,
    createdAt: organization.createdAt.toISOString(),
    updatedAt: organization.updatedAt.toISOString(),
  };
}
