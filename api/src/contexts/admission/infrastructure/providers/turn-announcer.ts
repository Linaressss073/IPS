import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../../../config/env.js';
import { AdvanceAnnouncements } from '../../application/commands/admission.commands.js';

/**
 * Every TURN_ANNOUNCER_INTERVAL_MS re-announces called turns and closes
 * those past their last call as "no se presentó". Conditional saves keep
 * several API instances (or a slow tick) from applying a step twice.
 */
@Injectable()
export class TurnAnnouncer implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(TurnAnnouncer.name);
  private timers: NodeJS.Timeout[] = [];
  /** The tick in progress; a new one is skipped until it ends. */
  private running = Promise.resolve();
  private busy = false;

  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly advance: AdvanceAnnouncements,
  ) {}

  onApplicationBootstrap(): void {
    const interval = this.config.get('TURN_ANNOUNCER_INTERVAL_MS', { infer: true });
    if (interval > 0) this.timers = [setInterval(() => this.tick(), interval)];
  }

  async onModuleDestroy(): Promise<void> {
    this.timers.forEach(clearInterval);
    await this.running;
  }

  private tick(): void {
    if (this.busy) return;
    this.busy = true;
    this.running = this.advance
      .execute()
      .then((result) => {
        if (result.reannounced + result.noShows > 0) {
          this.logger.debug(`Turns re-announced: ${result.reannounced}, no-shows: ${result.noShows}`);
        }
      })
      .catch((error: Error) => this.logger.warn(`Turn announcer failed: ${error.message}`))
      .finally(() => {
        this.busy = false;
      });
  }
}
