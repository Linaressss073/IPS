import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { validateEnv } from './config/env.js';
import { IdentityAccessModule } from './contexts/identity-access/identity-access.module.js';
import { PatientsModule } from './contexts/patients/patients.module.js';
import { StaffModule } from './contexts/staff/staff.module.js';
import { MongoModule } from './shared/infrastructure/persistence/mongo.module.js';
import { DatabaseModule } from './shared/infrastructure/persistence/database.module.js';
import { DomainErrorFilter } from './shared/entrypoints/http/filters/domain-error.filter.js';
import { HealthController } from './shared/entrypoints/http/controllers/health.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    DatabaseModule,
    MongoModule,
    IdentityAccessModule,
    PatientsModule,
    StaffModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: DomainErrorFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
