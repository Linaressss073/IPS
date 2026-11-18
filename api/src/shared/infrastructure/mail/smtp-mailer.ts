import { Logger } from '@nestjs/common';
import type { Transporter } from 'nodemailer';
import { MailMessage, Mailer } from '../../application/ports/mailer.port.js';

/**
 * SMTP mailer. `allowedRecipients` is null in production (anyone). Elsewhere
 * it is the only addresses that get mail, so a dev run against the real
 * server never reaches a real patient.
 */
export class SmtpMailer implements Mailer {
  private readonly logger = new Logger(SmtpMailer.name);

  constructor(
    private readonly transport: Pick<Transporter, 'sendMail'>,
    private readonly from: string,
    private readonly allowedRecipients: string[] | null,
  ) {}

  async send(message: MailMessage): Promise<boolean> {
    const to = message.to.trim().toLowerCase();
    if (this.allowedRecipients && !this.allowedRecipients.includes(to)) {
      this.logger.warn('Email dropped: recipient not in MAIL_DEV_ALLOW');
      return false;
    }
    try {
      await this.transport.sendMail({ from: this.from, ...message, to });
      return true;
    } catch (error) {
      // No recipient or body in the log: both can be patient data.
      this.logger.error(`Email not sent: ${error instanceof Error ? error.message : 'unknown error'}`);
      return false;
    }
  }
}

/** Used when MAIL_HOST is not set: the app runs, nothing is sent. */
export class DisabledMailer implements Mailer {
  async send(): Promise<boolean> {
    return false;
  }
}
