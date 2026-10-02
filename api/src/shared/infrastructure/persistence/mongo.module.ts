import {
  Global,
  Inject,
  Module,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Db, MongoClient } from 'mongodb';
import { Env } from '../../../config/env.js';
import { MONGO_CLIENT, MONGO_DB } from './mongo.js';
import { MongoConnection } from './mongo-connection.js';
import { ensureTraceEventIndexes } from './trace-event.writer.js';

/** The only database. See MongoConnection for how it connects. */
@Global()
@Module({
  providers: [
    {
      provide: MONGO_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        new MongoClient(config.get('MONGO_URL', { infer: true })),
    },
    {
      provide: MONGO_DB,
      inject: [MONGO_CLIENT],
      // The database comes from the URL path, e.g. mongodb://host/his.
      useFactory: (client: MongoClient) => client.db(),
    },
    MongoConnection,
  ],
  exports: [MONGO_CLIENT, MONGO_DB, MongoConnection],
})
export class MongoModule implements OnModuleInit, OnApplicationShutdown {
  constructor(
    @Inject(MONGO_CLIENT) private readonly client: MongoClient,
    @Inject(MONGO_DB) private readonly db: Db,
    private readonly connection: MongoConnection,
  ) {}

  onModuleInit(): void {
    this.connection.afterConnect('shared indexes', () => ensureTraceEventIndexes(this.db));
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.close();
  }
}
