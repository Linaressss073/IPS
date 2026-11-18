export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const MAILER = Symbol('Mailer');

/** Port to send email. Never throws: a failed send must not break the operation that triggered it. */
export interface Mailer {
  /** Returns true if the message was handed to the mail server. */
  send(message: MailMessage): Promise<boolean>;
}
