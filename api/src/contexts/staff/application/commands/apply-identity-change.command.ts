import { Clock } from '../../../../shared/application/index.js';
import { StaffRepository } from '../ports/staff.repository.port.js';
import { IdentityChange } from '../types/staff.types.js';

/** Keeps the local staff directory in step with one provider change. */
export class ApplyIdentityChange {
  constructor(
    private readonly staff: StaffRepository,
    private readonly clock: Clock,
  ) {}

  async execute(change: IdentityChange): Promise<void> {
    switch (change.kind) {
      case 'user.upserted':
        return this.staff.saveProfile(change.profile);
      case 'user.deleted':
        return this.staff.anonymize(change.userId, this.clock.now());
      case 'membership.upserted':
        if (change.profile) {
          await this.staff.saveProfile(change.profile, { onlyIfMissing: true });
        }
        return this.staff.saveMembership(change);
      case 'membership.deleted':
        return this.staff.removeMembership(change.teamId, change.userId);
      case 'team.deleted':
        return this.staff.removeTeam(change.teamId);
    }
  }
}
