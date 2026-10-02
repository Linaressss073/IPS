import { Clock } from '../../../../shared/application/index.js';
import { StaffProjection } from '../ports/staff-projection.port.js';
import { StaffRepository } from '../ports/staff.repository.port.js';
import { IdentityChange } from '../types/staff.types.js';

/**
 * Keeps the local staff directory in step with one provider change, then
 * refreshes the affected users in the read copy. If the copy fails the
 * error reaches the webhook, the provider retries and the (idempotent)
 * change is applied again.
 */
export class ApplyIdentityChange {
  constructor(
    private readonly staff: StaffRepository,
    private readonly projection: StaffProjection,
    private readonly clock: Clock,
  ) {}

  async execute(change: IdentityChange): Promise<void> {
    const affected = await this.apply(change);
    await this.projection.refresh(affected);
  }

  /** Applies the change and returns the users whose data it touched. */
  private async apply(change: IdentityChange): Promise<string[]> {
    switch (change.kind) {
      case 'user.upserted':
        await this.staff.saveProfile(change.profile);
        return [change.profile.userId];
      case 'user.deleted':
        await this.staff.anonymize(change.userId, this.clock.now());
        return [change.userId];
      case 'membership.upserted':
        if (change.profile) {
          await this.staff.saveProfile(change.profile, { onlyIfMissing: true });
        }
        await this.staff.saveMembership(change);
        return [change.userId];
      case 'membership.deleted':
        await this.staff.removeMembership(change.teamId, change.userId);
        return [change.userId];
      case 'team.deleted':
        return this.staff.removeTeam(change.teamId);
    }
  }
}
