import { TeamId } from '../../../../shared/domain/index.js';
import { OrganizationProfileInput } from '../../domain/entities/organization-profile.vo.js';
import { OrganizationProfileProps } from '../../domain/types/organization.types.js';

/** What the identity provider knows about an organization. */
export interface ProviderOrganization {
  id: TeamId;
  name: string;
  updatedAt: Date;
}

/** A change in the provider, translated by an anti-corruption adapter. */
export type OrganizationChange =
  | { kind: 'organization.upserted'; organization: ProviderOrganization }
  | { kind: 'organization.deleted'; id: TeamId };

export interface UpdateOrganizationCommand {
  teamId: TeamId;
  /** The version the client read; a newer stored one means a conflict. */
  expectedVersion: number;
  name?: string;
  /** Present fields replace the current ones; null clears a field. */
  profile: OrganizationProfileInput;
}

export interface DeleteOrganizationCommand {
  teamId: TeamId;
  deletedBy: string;
}

export interface OrganizationView extends OrganizationProfileProps {
  id: string;
  name: string;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}
