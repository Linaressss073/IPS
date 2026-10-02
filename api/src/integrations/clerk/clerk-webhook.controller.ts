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
import { Env } from '../../config/env.js';
import { ApplyOrganizationChange } from '../../contexts/organizations/application/commands/apply-organization-change.command.js';
import { toOrganizationChange } from '../../contexts/organizations/infrastructure/providers/clerk/clerk-organization-change.mapper.js';
import { ApplyIdentityChange } from '../../contexts/staff/application/commands/apply-identity-change.command.js';
import { toIdentityChange } from '../../contexts/staff/infrastructure/providers/clerk/clerk-identity-change.mapper.js';

/**
 * Receives Clerk webhooks (no session: authenticity comes from the
 * signature over the raw body) and hands each event to every context that
 * keeps a copy of Clerk data, each with its own anti-corruption mapper.
 * Payloads contain personal data, so only the event type is ever logged.
 */
@Controller('webhooks/clerk')
export class ClerkWebhookController {
  private readonly logger = new Logger(ClerkWebhookController.name);

  constructor(
    private readonly applyIdentityChange: ApplyIdentityChange,
    private readonly applyOrganizationChange: ApplyOrganizationChange,
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

    // A failure answers 5xx, so Clerk retries the event later.
    const identityChange = toIdentityChange(event);
    if (identityChange) await this.applyIdentityChange.execute(identityChange);
    const organizationChange = toOrganizationChange(event);
    if (organizationChange) {
      await this.applyOrganizationChange.execute(organizationChange);
    }

    const handled = identityChange || organizationChange;
    this.logger.log(`Clerk ${event.type} ${handled ? 'applied' : 'ignored'}`);
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
