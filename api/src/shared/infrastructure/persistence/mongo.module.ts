import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient } from 'mongodb';
import { Env } from '../../../config/env.js';
import { TraceEventRelay } from '../providers/trace-event-relay.js';
import { MONGO_CLIENT, MONGO_DB } from './mongo.js';

/**
 * Optional Mongo connection for read models. Without MONGO_URL both tokens
 * resolve to null and the app runs on Postgres only.
 */
@Global()
@Module({
  providers: [
    {
      provide: MONGO_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const url = config.get('MONGO_URL', { infer: true });
        return url ? new MongoClient(url) : null;
      },
    },
    {
      provide: MONGO_DB,
      inject: [MONGO_CLIENT],
      // The database comes from the URL path, e.g. mongodb://host/his.
      useFactory: (client: MongoClient | null) => client?.db() ?? null,
    },
    TraceEventRelay,
  ],
  exports: [MONGO_DB, TraceEventRelay],
})
export class MongoModule implements OnApplicationShutdown {
  constructor(
    @Inject(MONGO_CLIENT) private readonly client: MongoClient | null,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client?.close();
  }
}
