import type { ClerkClient } from '@clerk/backend';
import { TeamId, UserId } from '../../../../../shared/domain/index.js';
import { TeamMembershipChecker } from '../../../application/ports/team-membership-checker.port.js';
import { normalizeRole } from '../../../domain/constants/roles.js';
import { NotATeamMemberError } from '../../../domain/errors/not-a-team-member.error.js';

const CACHE_TTL_MS = 30_000;

/**
 * Anti-corruption layer over Clerk Organizations: a team (IPS) is a Clerk
 * organization, and the rest of the backend only sees this port.
 * One targeted lookup per (organization, user), cached briefly so a burst
 * of requests hits Clerk once. Unknown organizations count as "not a member".
 */
export class ClerkTeamMembershipChecker implements TeamMembershipChecker {
  /** The user's roles in the team: one, or none if not a member. */
  private readonly cache = new Map<string, { roles: string[]; expiresAt: number }>();

  constructor(private readonly clerk: ClerkClient) {}

  async isMember(userId: UserId, teamId: TeamId): Promise<boolean> {
    return (await this.rolesIn(userId, teamId)).length > 0;
  }

  async roleIn(userId: UserId, teamId: TeamId): Promise<string> {
    const [role] = await this.rolesIn(userId, teamId);
    if (!role) throw new NotATeamMemberError(teamId);
    return role;
  }

  private async rolesIn(userId: UserId, teamId: TeamId): Promise<string[]> {
    const key = `${teamId.value}:${userId.value}`;
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.roles;

    const roles = await this.clerk.organizations
      .getOrganizationMembershipList({
        organizationId: teamId.value,
        userId: [userId.value],
        limit: 1,
      })
      .then(({ data }) => data.flatMap((membership) => normalizeRole(membership.role)))
      .catch(() => []);

    this.cache.set(key, { roles, expiresAt: Date.now() + CACHE_TTL_MS });
    return roles;
  }
}
