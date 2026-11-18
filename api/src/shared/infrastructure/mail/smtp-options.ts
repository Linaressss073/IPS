import type { MailEnv } from '../../../config/env.js';

/** A mail server that hangs must not hold a request for minutes (nodemailer's defaults are 2 min to connect and 10 min of silence). */
export const SMTP_TIMEOUT_MS = 10_000;

export function smtpOptions(mail: MailEnv) {
  return {
    host: mail.host,
    port: mail.port,
    secure: mail.secure,
    requireTLS: mail.requireTls,
    auth: { user: mail.user, pass: mail.pass },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  };
}
