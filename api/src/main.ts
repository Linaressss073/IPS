import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { Env } from './config/env.js';
import { API_PREFIX } from './config/http.js';
import { setupOpenApi } from './config/openapi.js';

async function bootstrap() {
  // rawBody: webhook signatures are computed over the exact bytes received.
  const app = await NestFactory.create(AppModule, { rawBody: true, bufferLogs: true });
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix(API_PREFIX);
  setupOpenApi(app);
  app.enableCors({ origin: config.get('CORS_ORIGIN') });
  app.enableShutdownHooks();

  await app.listen(config.get('PORT'));
}
await bootstrap();
