import type { INestApplication } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import helmet from 'helmet';

/**
 * Who is asking: behind Render every request reaches the API from the proxy, so
 * the socket address says nothing. Cloudflare sets `CF-Connecting-IP` with the
 * real client address (and overwrites any value the client sends); without it
 * (local development, tests) the socket address is used.
 */
const clientKey = (req: Request): string => {
  const cloudflare = req.headers['cf-connecting-ip'];
  return typeof cloudflare === 'string' && cloudflare ? cloudflare : ipKeyGenerator(req.ip ?? '');
};

/**
 * Standard security headers (X-Content-Type-Options, Referrer-Policy, HSTS, no
 * X-Powered-By…) and a limit of requests per minute per client (429 above it).
 * The Content-Security-Policy is left off here: this API returns JSON, and
 * Swagger UI (`/docs`) needs inline scripts that the default policy blocks.
 * `/health` is never limited: UptimeRobot and Render poll it.
 */
export function setupHttpSecurity(app: INestApplication, limitPerMinute: number): void {
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: limitPerMinute,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      keyGenerator: clientKey,
      skip: (req) => req.path.endsWith('/health'),
      handler: (_req: Request, res: Response) => {
        res.status(429).json({
          statusCode: 429,
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many requests: wait a minute and try again',
        });
      },
    }),
  );
}
