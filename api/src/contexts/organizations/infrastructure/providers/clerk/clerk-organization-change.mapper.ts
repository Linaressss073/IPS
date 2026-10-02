import type { WebhookEvent } from '@clerk/backend/webhooks';
import { TeamId } from '../../../../../shared/domain/index.js';
import { OrganizationChange } from '../../../application/types/organization.types.js';

/** Clerk webhook events -> OrganizationChange; null for the others. */
export function toOrganizationChange(event: WebhookEvent): OrganizationChange | null {
  switch (event.type) {
    case 'organization.created':
    case 'organization.updated':
      return {
        kind: 'organization.upserted',
        organization: {
          id: TeamId.of(event.data.id),
          name: event.data.name,
          updatedAt: new Date(event.data.updated_at),
        },
      };
    case 'organization.deleted':
      return event.data.id
        ? { kind: 'organization.deleted', id: TeamId.of(event.data.id) }
        : null;
    default:
      return null;
  }
}
