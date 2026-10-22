import { createRequire } from 'node:module';
import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { loadDeploymentConfig } from './config/deployment-config.js';
import { type Env, validateEnv } from './config/env.js';
import { IdentityAccessModule } from './contexts/identity-access/identity-access.module.js';
import { AdmissionModule } from './contexts/admission/admission.module.js';
import { ConsultationModule } from './contexts/consultation/consultation.module.js';
import { PharmacyModule } from './contexts/pharmacy/pharmacy.module.js';
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
    // One readable line per log (pino-pretty) everywhere but the e2e, where logs are silent. Never logs tokens.
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        pinoHttp: {
          level: config.get('LOG_LEVEL'),
          redact: ['req.headers.authorization', 'req.headers.cookie', 'req.headers["svix-signature"]'],
          autoLogging: { ignore: (req) => req.url?.endsWith('/health') ?? false },
          // Requests log as "GET /api/v1/... 200" with no headers.
          serializers: { req: (req) => ({ method: req.method, url: req.url }), res: (res) => ({ status: res.statusCode }) },
          customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
          customErrorMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
          transport:
            process.env.ENV === 'test'
              ? undefined
              : {
                  // Resolved here: pino cannot find it from inside nestjs-pino under pnpm's strict layout.
                  target: createRequire(import.meta.url).resolve('pino-pretty'),
                  options: {
                    // Render's log viewer renders ANSI colors; set NO_COLOR=1 to turn them off.
                    colorize: process.env.NO_COLOR === undefined,
                    translateTime: 'SYS:HH:MM:ss.l',
                    ignore: 'hostname,context,req,res',
                    messageFormat: '{if context}[{context}] {end}{msg}',
                    singleLine: true,
                  },
                },
        },
      }),
    }),
    MongoModule,
    IdentityAccessModule,
    PatientsModule,
    SchedulingModule,
    AdmissionModule,
    ConsultationModule,
    PharmacyModule,
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
