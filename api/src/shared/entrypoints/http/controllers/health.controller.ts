import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Db } from 'mongodb';
import { MONGO_DB } from '../../../infrastructure/persistence/mongo.js';

@Controller('health')
export class HealthController {
  constructor(@Inject(MONGO_DB) private readonly db: Db) {}

  /** 503 when the database is unreachable, so load balancers take the instance out. */
  @Get()
  async check() {
    try {
      await this.db.command({ ping: 1 }, { timeoutMS: 3000 });
    } catch {
      throw new ServiceUnavailableException({
        status: 'degraded',
        database: 'down',
      });
    }
    return { status: 'ok', database: 'up' };
  }
}
