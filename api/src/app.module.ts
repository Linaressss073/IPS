import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { loadDeploymentConfig } from './config/deployment-config.js';
import { validateEnv } from './config/env.js';
import { IdentityAccessModule } from './contexts/identity-access/identity-access.module.js';
import { PatientsModule } from './contexts/patients/patients.module.js';
import { SchedulingModule } from './contexts/scheduling/scheduling.module.js';
import { OrganizationsModule } from './contexts/organizations/organizations.module.js';
import { StaffModule } from './contexts/staff/staff.module.js';
import { ClerkIntegrationModule } from './integrations/clerk/clerk-integration.module.js';
import { MongoModule } from './shared/infrastructure/persistence/mongo.module.js';
import { DomainErrorFilter } from './shared/entrypoints/http/filters/domain-error.filter.js';
import { HealthController } from './shared/entrypoints/http/controllers/health.controller.js';

@Module({
  imports: [
    // deployment/config.json + secrets.<ENV>.json, overridden by real
    // environment variables (e.g. Render's dashboard). No .env files.
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      validate: (environment) =>
        validateEnv({ ...loadDeploymentConfig(), ...environment }),
    }),
    MongoModule,
    IdentityAccessModule,
    PatientsModule,
    SchedulingModule,
    StaffModule,
    OrganizationsModule,
    ClerkIntegrationModule,
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
