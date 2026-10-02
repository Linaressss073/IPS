import type { ClerkClient } from '@clerk/backend';
import { TeamId } from '../../../../../shared/domain/index.js';
import { IdentitySource } from '../../../application/ports/identity-source.port.js';
import { IdentityChange } from '../../../application/types/staff.types.js';
import { StaffProfile } from '../../../domain/entities/staff-profile.vo.js';

const PAGE_SIZE = 100;

/**
 * Every current Clerk user and organization membership, read page by page
 * from the Backend API and translated to IdentityChange (same minimization as
 * the webhooks: name and masked e-mail only).
 */
export class ClerkIdentitySource implements IdentitySource {
  constructor(private readonly clerk: ClerkClient) {}

  async *snapshot(): AsyncIterable<IdentityChange> {
    for await (const user of paginate((offset) =>
      this.clerk.users.getUserList({ limit: PAGE_SIZE, offset }),
    )) {
      yield {
        kind: 'user.upserted',
        profile: StaffProfile.of({
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.primaryEmailAddress?.emailAddress,
          sourceUpdatedAt: new Date(user.updatedAt),
        }),
      };
    }

    for await (const organization of paginate((offset) =>
      this.clerk.organizations.getOrganizationList({ limit: PAGE_SIZE, offset }),
    )) {
      for await (const membership of paginate((offset) =>
        this.clerk.organizations.getOrganizationMembershipList({
          organizationId: organization.id,
          limit: PAGE_SIZE,
          offset,
        }),
      )) {
        const userId = membership.publicUserData?.userId;
        if (!userId) continue;
        yield {
          kind: 'membership.upserted',
          teamId: TeamId.of(organization.id),
          userId,
          providerRole: membership.role,
          sourceUpdatedAt: new Date(membership.updatedAt),
          profile: null, // users were all loaded above
        };
      }
    }
  }
}

async function* paginate<T>(
  page: (offset: number) => Promise<{ data: T[] }>,
): AsyncIterable<T> {
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data } = await page(offset);
    yield* data;
    if (data.length < PAGE_SIZE) return;
  }
}
