import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { Env } from '../../../config/env.js';
import { MAILER, Mailer } from '../../application/ports/mailer.port.js';
import { smtpOptions } from './smtp-options.js';
import { DisabledMailer, SmtpMailer } from './smtp-mailer.js';

/** Email through the SMTP server in MAIL_* (Spacemail). Without MAIL_HOST nothing is sent. */
@Global()
@Module({
  providers: [
    {
      provide: MAILER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): Mailer => {
        const mail = config.get('MAIL', { infer: true });
        if (!mail) return new DisabledMailer();
        const transport = createTransport(smtpOptions(mail));
        return new SmtpMailer(transport, mail.from, mail.devAllow);
      },
    },
  ],
  exports: [MAILER],
})
export class MailModule {}
