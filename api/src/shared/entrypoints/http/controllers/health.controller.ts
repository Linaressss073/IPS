import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { sql } from 'drizzle-orm';
import {
  DRIZZLE,
  type Database,
} from '../../../infrastructure/persistence/database.module.js';

@Controller('health')
export class HealthController {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /** 503 when the database is unreachable, so load balancers take the instance out. */
  @Get()
  async check() {
    try {
      await this.db.execute(sql`select 1`);
    } catch {
      throw new ServiceUnavailableException({
        status: 'degraded',
        database: 'down',
      });
    }
    return { status: 'ok', database: 'up' };
  }
}
