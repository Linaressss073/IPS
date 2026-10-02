import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { asc, inArray, isNull } from 'drizzle-orm';
import type { Collection } from 'mongodb';
import { Env } from '../../../config/env.js';
import { DRIZZLE, type Database } from '../persistence/database.module.js';
import {
  MONGO_DB,
  type MongoDatabase,
  TIMELINE_COLLECTION,
  TimelineDocument,
} from '../persistence/mongo.js';
import { TraceEventRow, traceEvents } from '../persistence/trace-events.schema.js';

const BATCH_SIZE = 200;

/**
 * Outbox relay: copies trace events from Postgres (source of truth) to the
 * Mongo timeline read model. Writes never depend on Mongo; if it is down,
 * events stay pending in Postgres and are copied once it is back.
 * Delivery is at-least-once and idempotent (the event id is the Mongo _id).
 */
@Injectable()
export class TraceEventRelay implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(TraceEventRelay.name);
  private timer?: NodeJS.Timeout;
  private running: Promise<number> | null = null;

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(MONGO_DB) private readonly mongo: MongoDatabase,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.mongo) return;
    await this.timeline().createIndex({
      teamId: 1,
      patientId: 1,
      occurredAt: 1,
      position: 1,
    });

    const interval = this.config.get('RELAY_INTERVAL_MS', { infer: true });
    if (interval > 0) {
      this.timer = setInterval(() => void this.tick(), interval);
    }
  }

  async onModuleDestroy(): Promise<void> {
    clearInterval(this.timer);
    await this.running?.catch(() => undefined);
  }

  /** Publishes everything pending right now; used by tests and scripts. */
  async flush(): Promise<number> {
    await this.running?.catch(() => undefined);
    return this.publishPending();
  }

  /** Runs never overlap: a call during a run waits for that run. */
  private publishPending(): Promise<number> {
    this.running ??= this.publishAll().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  private async tick(): Promise<void> {
    try {
      await this.publishPending();
    } catch (error) {
      this.logger.warn(`Trace events not published yet: ${String(error)}`);
    }
  }

  private async publishAll(): Promise<number> {
    if (!this.mongo) return 0;
    let total = 0;
    for (;;) {
      const published = await this.publishBatch();
      total += published;
      if (published < BATCH_SIZE) return total;
    }
  }

  /**
   * Locks a batch of pending rows, writes them to Mongo and marks them as
   * published in the same transaction: if Mongo fails, nothing is marked.
   */
  private publishBatch(): Promise<number> {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(traceEvents)
        .where(isNull(traceEvents.publishedAt))
        .orderBy(asc(traceEvents.position))
        .limit(BATCH_SIZE)
        .for('update', { skipLocked: true });
      if (rows.length === 0) return 0;

      await this.timeline().bulkWrite(
        rows.map((row) => ({
          replaceOne: {
            filter: { _id: row.id },
            replacement: toDocument(row),
            upsert: true,
          },
        })),
        { ordered: false },
      );
      await tx
        .update(traceEvents)
        .set({ publishedAt: new Date() })
        .where(
          inArray(
            traceEvents.id,
            rows.map((row) => row.id),
          ),
        );
      return rows.length;
    });
  }

  private timeline(): Collection<TimelineDocument> {
    return this.mongo!.collection<TimelineDocument>(TIMELINE_COLLECTION);
  }
}

function toDocument(row: TraceEventRow): TimelineDocument {
  return {
    _id: row.id,
    position: row.position,
    teamId: row.teamId,
    patientId: row.patientId,
    type: row.type,
    requestedBy: row.requestedBy,
    executedBy: row.executedBy,
    occurredAt: row.occurredAt,
    data: row.data,
  };
}
