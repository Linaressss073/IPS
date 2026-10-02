import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import type { MongoClient } from 'mongodb';
import { MONGO_CLIENT } from './mongo.js';

const RETRY_MS = 5000;

/**
 * Connects at startup and, if MongoDB is unreachable, keeps retrying in the
 * background: the driver gives up for good when its first (implicit)
 * connection fails, but recovers by itself from outages once connected.
 * The API boots either way; GET /health reports the database down meanwhile.
 */
@Injectable()
export class MongoConnection implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(MongoConnection.name);
  private readonly tasks: { name: string; run: () => Promise<unknown> }[] = [];
  private timer?: NodeJS.Timeout;
  private stopped = false;

  constructor(@Inject(MONGO_CLIENT) private readonly client: MongoClient) {}

  /**
   * Runs `run` once connected (e.g. creating a context's indexes, which is
   * idempotent). Register it in onModuleInit, before the app bootstraps.
   */
  afterConnect(name: string, run: () => Promise<unknown>): void {
    this.tasks.push({ name, run });
  }

  /** The first attempt is awaited, so normally the indexes exist before serving. */
  async onApplicationBootstrap(): Promise<void> {
    await this.attempt();
  }

  onModuleDestroy(): void {
    this.stopped = true;
    clearTimeout(this.timer);
  }

  private async attempt(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      if (this.stopped) return;
      this.logger.warn(
        `MongoDB unreachable, retrying in ${RETRY_MS / 1000}s: ${(error as Error).message}`,
      );
      this.timer = setTimeout(() => void this.attempt(), RETRY_MS);
      return;
    }
    for (const task of this.tasks) {
      try {
        await task.run();
      } catch (error) {
        this.logger.warn(`${task.name} failed: ${(error as Error).message}`);
      }
    }
  }
}
