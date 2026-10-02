import type { HexclaveServerApp } from '@hexclave/js';
import { TeamId, UserId } from '../../../../../shared/domain/index.js';
import { TeamMembershipChecker } from '../../../application/ports/team-membership-checker.port.js';

const CACHE_TTL_MS = 30_000;

/**
 * Anti-corruption layer over Hexclave's team API: the rest of the backend
 * only sees the TeamMembershipChecker port, never Hexclave types.
 * Results are cached briefly so a burst of requests hits Hexclave once.
 */
export class HexclaveTeamMembershipChecker implements TeamMembershipChecker {
  private readonly cache = new Map<
    string,
    { member: boolean; expiresAt: number }
  >();

  constructor(private readonly hexclave: HexclaveServerApp) {}

  async isMember(userId: UserId, teamId: TeamId): Promise<boolean> {
    const key = `${teamId.value}:${userId.value}`;
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.member;

    const team = await this.hexclave.getTeam(teamId.value);
    const member =
      !!team &&
      (await team.listUsers()).some((user) => user.id === userId.value);

    this.cache.set(key, { member, expiresAt: Date.now() + CACHE_TTL_MS });
    return member;
  }
}
