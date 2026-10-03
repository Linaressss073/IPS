import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../config/env.js';
import { SyncOrganizationsFromProvider } from '../../contexts/organizations/application/commands/sync-organizations-from-provider.command.js';
import { SyncStaffFromProvider } from '../../contexts/staff/application/commands/sync-staff-from-provider.command.js';

/** First run shortly after startup, without delaying it. */
const FIRST_RUN_DELAY_MS = 15_000;

/**
 * Safety net for the webhooks: every CLERK_SYNC_INTERVAL_MS (and once after
 * startup) compares organizations, users and memberships with Clerk and
 * applies whatever a missed webhook left behind, deletions included. On
 * Render's free plan the API sleeps and webhooks arrive late; this catches
 * up on wake. Runs never overlap; a failed run is retried on the next tick.
 */
@Injectable()
export class ClerkReconciler implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(ClerkReconciler.name);
  private timers: NodeJS.Timeout[] = [];
  private running: Promise<void> | null = null;

  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly organizations: SyncOrganizationsFromProvider,
    private readonly staff: SyncStaffFromProvider,
  ) {}

  onApplicationBootstrap(): void {
    const interval = this.config.get('CLERK_SYNC_INTERVAL_MS', { infer: true });
    if (interval <= 0) return;
    this.timers = [
      setTimeout(() => void this.run(), Math.min(FIRST_RUN_DELAY_MS, interval)),
      setInterval(() => void this.run(), interval),
    ];
  }

  async onModuleDestroy(): Promise<void> {
    this.timers.forEach(clearTimeout);
    await this.running;
  }

  /** One full reconciliation; concurrent calls share the run in progress. */
  run(): Promise<void> {
    this.running ??= this.reconcile().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  private async reconcile(): Promise<void> {
    try {
      // Organizations first: memberships of a deleted one are then removed too.
      const organizations = await this.organizations.execute();
      const staff = await this.staff.execute();
      const removed =
        organizations.removed + staff.removedUsers + staff.removedMemberships;
      const summary =
        `Clerk reconciled: ${organizations.applied} organizations, ${staff.applied} users/memberships` +
        (removed > 0
          ? `; removed ${organizations.removed} organizations, ${staff.removedUsers} users, ${staff.removedMemberships} memberships`
          : '');
      if (removed > 0) this.logger.log(summary);
      else this.logger.debug(summary);
    } catch (error) {
      this.logger.warn(`Clerk reconciliation failed, retrying next time: ${(error as Error).message}`);
    }
  }
}
