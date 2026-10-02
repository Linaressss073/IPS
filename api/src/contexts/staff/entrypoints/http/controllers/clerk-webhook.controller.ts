import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  ServiceUnavailableException,
  type RawBodyRequest,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyWebhook } from '@clerk/backend/webhooks';
import type { Request as ExpressRequest } from 'express';
import { Env } from '../../../../../config/env.js';
import { ApplyIdentityChange } from '../../../application/commands/apply-identity-change.command.js';
import { toIdentityChange } from '../../../infrastructure/providers/clerk/clerk-identity-change.mapper.js';

/**
 * Receives Clerk webhooks (no session: authenticity comes from the
 * signature over the raw body). Payloads contain personal data, so only the
 * event type and id are ever logged.
 */
@Controller('webhooks/clerk')
export class ClerkWebhookController {
  private readonly logger = new Logger(ClerkWebhookController.name);

  constructor(
    private readonly apply: ApplyIdentityChange,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async receive(
    @Req() request: RawBodyRequest<ExpressRequest>,
  ): Promise<{ received: true }> {
    const signingSecret = this.config.get('CLERK_WEBHOOK_SIGNING_SECRET', {
      infer: true,
    });
    if (!signingSecret) {
      throw new ServiceUnavailableException('Clerk webhooks are not configured');
    }

    let event: Awaited<ReturnType<typeof verifyWebhook>>;
    try {
      event = await verifyWebhook(toFetchRequest(request), { signingSecret });
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    const change = toIdentityChange(event);
    if (change) await this.apply.execute(change);
    this.logger.log(`Clerk ${event.type} ${change ? 'applied' : 'ignored'}`);
    return { received: true };
  }
}

/** Express request -> Fetch API Request with the untouched body. */
function toFetchRequest(request: RawBodyRequest<ExpressRequest>): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (value !== undefined) {
      headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    }
  }
  return new Request(`http://localhost${request.originalUrl}`, {
    method: 'POST',
    headers,
    body: new Uint8Array(request.rawBody ?? Buffer.alloc(0)),
  });
}
