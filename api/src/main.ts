import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { Env } from './config/env.js';
import { API_PREFIX } from './config/http.js';
import { setupHttpSecurity } from './config/http-security.js';
import { setupOpenApi } from './config/openapi.js';
import { requestMetrics, startTelemetry, telemetryStatus } from './config/telemetry.js';

async function bootstrap() {
  // Before anything else, so every request is measured. Render stops the free
  // instance with SIGTERM: flush what is pending before it goes.
  const telemetry = startTelemetry();
  process.once('SIGTERM', () => void telemetry?.shutdown());

  // rawBody: webhook signatures are computed over the exact bytes received.
  const app = await NestFactory.create(AppModule, { rawBody: true, bufferLogs: true });
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.useLogger(app.get(Logger));
  app.use(requestMetrics()); // first, so the 429s are measured too
  setupHttpSecurity(app, config.get('RATE_LIMIT_PER_MINUTE'));
  app.setGlobalPrefix(API_PREFIX);
  setupOpenApi(app);
  app.enableCors({ origin: config.get('CORS_ORIGIN') });
  app.enableShutdownHooks();

  await app.listen(config.get('PORT'));
  const { level, message } = telemetryStatus();
  app.get(Logger)[level](message, 'Telemetry');
}
await bootstrap();
