import { Clock } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import { IdentitySource } from '../ports/identity-source.port.js';
import { StaffRepository } from '../ports/staff.repository.port.js';
import { ApplyIdentityChange } from './apply-identity-change.command.js';

/**
 * Reconciles the directory with the provider: applies every current user
 * and membership, then removes what the provider no longer has (users
 * deleted or memberships removed while a webhook was missed). Safe to run
 * any number of times.
 *
 * Only data last changed before the run started is removed, so something
 * a webhook adds meanwhile is never mistaken for a deletion; and an empty
 * snapshot removes nothing (more likely a misconfiguration than an empty IPS).
 */
export class SyncStaffFromProvider {
  constructor(
    private readonly source: IdentitySource,
    private readonly apply: ApplyIdentityChange,
    private readonly staff: StaffRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<{ applied: number; removedUsers: number; removedMemberships: number }> {
    const startedAt = this.clock.now();
    const users = new Set<string>();
    const memberships = new Set<string>();
    let applied = 0;
    for await (const change of this.source.snapshot()) {
      if (change.kind === 'user.upserted') users.add(change.profile.userId);
      if (change.kind === 'membership.upserted') {
        memberships.add(key(change.teamId.value, change.userId));
      }
      await this.apply.execute(change);
      applied += 1;
    }
    if (users.size === 0) return { applied, removedUsers: 0, removedMemberships: 0 };

    let removedUsers = 0;
    let removedMemberships = 0;
    for (const stored of await this.staff.listActive()) {
      if (!users.has(stored.userId)) {
        if (stored.sourceUpdatedAt < startedAt) {
          await this.apply.execute({ kind: 'user.deleted', userId: stored.userId });
          removedUsers += 1;
        }
        continue;
      }
      for (const team of stored.teams) {
        if (!memberships.has(key(team.teamId, stored.userId)) && team.sourceUpdatedAt < startedAt) {
          await this.apply.execute({
            kind: 'membership.deleted',
            teamId: TeamId.of(team.teamId),
            userId: stored.userId,
          });
          removedMemberships += 1;
        }
      }
    }
    return { applied, removedUsers, removedMemberships };
  }
}

const key = (teamId: string, userId: string) => `${teamId}/${userId}`;
