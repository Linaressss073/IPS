import type { ClerkClient } from '@clerk/backend';
import { TeamId, UserId } from '../../../../../shared/domain/index.js';
import { TeamMembershipChecker } from '../../../application/ports/team-membership-checker.port.js';
import { normalizeRole } from '../../../domain/constants/roles.js';

const CACHE_TTL_MS = 30_000;

/**
 * Anti-corruption layer over Clerk Organizations: a team (IPS) is a Clerk
 * organization, and the rest of the backend only sees this port.
 * One targeted lookup per (organization, user), cached briefly so a burst
 * of requests hits Clerk once. Unknown organizations count as "not a member".
 */
export class ClerkTeamMembershipChecker implements TeamMembershipChecker {
  private readonly cache = new Map<
    string,
    { role: string | null; expiresAt: number }
  >();

  constructor(private readonly clerk: ClerkClient) {}

  async isMember(userId: UserId, teamId: TeamId): Promise<boolean> {
    return (await this.roleIn(userId, teamId)) !== null;
  }

  async roleIn(userId: UserId, teamId: TeamId): Promise<string | null> {
    const key = `${teamId.value}:${userId.value}`;
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.role;

    let role: string | null = null;
    try {
      const { data } =
        await this.clerk.organizations.getOrganizationMembershipList({
          organizationId: teamId.value,
          userId: [userId.value],
          limit: 1,
        });
      role = data.length > 0 ? normalizeRole(data[0].role) : null;
    } catch {
      role = null;
    }

    this.cache.set(key, { role, expiresAt: Date.now() + CACHE_TTL_MS });
    return role;
  }
}
