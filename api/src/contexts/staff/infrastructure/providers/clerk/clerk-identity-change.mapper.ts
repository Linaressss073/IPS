import type { OrganizationMembershipJSON, UserJSON } from '@clerk/backend';
import type { WebhookEvent } from '@clerk/backend/webhooks';
import { TeamId } from '../../../../../shared/domain/index.js';
import { IdentityChange } from '../../../application/types/staff.types.js';
import { StaffProfile } from '../../../domain/entities/staff-profile.vo.js';

/**
 * Anti-corruption layer: Clerk webhook events -> IdentityChange. Only the id,
 * name and primary e-mail of a user are read, and the e-mail is masked
 * right away by StaffProfile; everything else in the payload is ignored.
 * Returns null for events the staff directory does not care about.
 */
export function toIdentityChange(event: WebhookEvent): IdentityChange | null {
  switch (event.type) {
    case 'user.created':
    case 'user.updated':
      return { kind: 'user.upserted', profile: profileFromUser(event.data) };
    case 'user.deleted':
      return event.data.id ? { kind: 'user.deleted', userId: event.data.id } : null;
    case 'organizationMembership.created':
    case 'organizationMembership.updated':
      return membershipUpserted(event.data);
    case 'organizationMembership.deleted':
      return {
        kind: 'membership.deleted',
        teamId: TeamId.of(event.data.organization.id),
        userId: event.data.public_user_data.user_id,
      };
    case 'organization.deleted':
      return event.data.id
        ? { kind: 'team.deleted', teamId: TeamId.of(event.data.id) }
        : null;
    default:
      return null;
  }
}

export function profileFromUser(user: UserJSON): StaffProfile {
  const primary = user.email_addresses.find(
    (email) => email.id === user.primary_email_address_id,
  );
  return StaffProfile.of({
    userId: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    username: user.username,
    email: primary?.email_address,
    sourceUpdatedAt: new Date(user.updated_at),
  });
}

export function membershipUpserted(
  membership: OrganizationMembershipJSON,
): IdentityChange {
  const user = membership.public_user_data;
  const sourceUpdatedAt = new Date(membership.updated_at);
  return {
    kind: 'membership.upserted',
    teamId: TeamId.of(membership.organization.id),
    userId: user.user_id,
    providerRole: membership.role,
    sourceUpdatedAt,
    // `identifier` is the e-mail (or phone/username): masked if it is an e-mail.
    profile: StaffProfile.of({
      userId: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.identifier,
      sourceUpdatedAt,
    }),
  };
}
