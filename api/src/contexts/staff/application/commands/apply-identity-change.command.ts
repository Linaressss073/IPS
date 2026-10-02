import { Clock } from '../../../../shared/application/index.js';
import { StaffRepository } from '../ports/staff.repository.port.js';
import { IdentityChange } from '../types/staff.types.js';

/**
 * Keeps the local staff directory in step with one provider change. Every
 * change is idempotent: if it fails, the webhook is retried and applied again.
 */
export class ApplyIdentityChange {
  constructor(
    private readonly staff: StaffRepository,
    private readonly clock: Clock,
  ) {}

  async execute(change: IdentityChange): Promise<void> {
    switch (change.kind) {
      case 'user.upserted':
        await this.staff.saveProfile(change.profile);
        return;
      case 'user.deleted':
        await this.staff.anonymize(change.userId, this.clock.now());
        return;
      case 'membership.upserted':
        if (change.profile) {
          await this.staff.saveProfile(change.profile, { onlyIfMissing: true });
        }
        await this.staff.saveMembership(change);
        return;
      case 'membership.deleted':
        await this.staff.removeMembership(change.teamId, change.userId);
        return;
      case 'team.deleted':
        await this.staff.removeTeam(change.teamId);
        return;
    }
  }
}
