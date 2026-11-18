import { Logger } from '@nestjs/common';
import { DisabledMailer, SmtpMailer } from './smtp-mailer.js';
import { SMTP_TIMEOUT_MS, smtpOptions } from './smtp-options.js';
import { validateEnv } from '../../../config/env.js';

const message = { to: 'Ana@Clinica.co', subject: 'Cita', html: '<b>hola</b>' };

describe('SmtpMailer', () => {
  it('sends with the configured sender and a normalized recipient (prod: anyone)', async () => {
    const sendMail = vi.fn().mockResolvedValue({});
    const mailer = new SmtpMailer({ sendMail }, 'IPS <a@b.co>', null);

    expect(await mailer.send(message)).toBe(true);
    expect(sendMail).toHaveBeenCalledWith({ from: 'IPS <a@b.co>', ...message, to: 'ana@clinica.co' });
  });

  it('outside prod, drops mail to anyone not in the allow list', async () => {
    const sendMail = vi.fn().mockResolvedValue({});
    const mailer = new SmtpMailer({ sendMail }, 'x@y.co', ['dev@mio.co']);

    expect(await mailer.send(message)).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
    expect(await mailer.send({ ...message, to: ' DEV@mio.co ' })).toBe(true);
  });

  it('with an empty allow list, sends nothing (tests, fresh dev)', async () => {
    const sendMail = vi.fn();
    expect(await new SmtpMailer({ sendMail }, 'x@y.co', []).send(message)).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('never throws when the server fails', async () => {
    const sendMail = vi.fn().mockRejectedValue(new Error('535 auth failed'));
    expect(await new SmtpMailer({ sendMail }, 'x@y.co', null).send(message)).toBe(false);
  });

  it('logs only the error codes, never the recipient a rejection repeats', async () => {
    const error = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const rejection = Object.assign(new Error('550 5.1.1 <ana@clinica.co> User unknown'), {
      code: 'EENVELOPE',
      responseCode: 550,
    });
    const sendMail = vi.fn().mockRejectedValue(rejection);

    expect(await new SmtpMailer({ sendMail }, 'x@y.co', null).send(message)).toBe(false);
    expect(error).toHaveBeenCalledWith('Email not sent: EENVELOPE 550');
    expect(JSON.stringify(error.mock.calls)).not.toContain('clinica.co');

    await new SmtpMailer({ sendMail: vi.fn().mockRejectedValue(new Error('boom')) }, 'x@y.co', null).send(message);
    expect(error).toHaveBeenLastCalledWith('Email not sent: UNKNOWN');
    error.mockRestore();
  });

  it('DisabledMailer sends nothing', async () => {
    expect(await new DisabledMailer().send()).toBe(false);
  });
});

describe('MAIL env', () => {
  const base = { MONGO_URL: 'mongodb://x/his', CLERK_SECRET_KEY: 'sk_test_x' };
  const mail = {
    MAIL_HOST: 'mail.spacemail.com',
    MAIL_USER: 'contacto@devrojas.xyz',
    MAIL_PASS: 'secret',
    MAIL_FROM: 'IPS <contacto@devrojas.xyz>',
  };

  it('is off without MAIL_HOST', () => {
    expect(validateEnv(base).MAIL).toBeUndefined();
  });

  it('defaults to port 465 with TLS and restricts recipients outside prod', () => {
    expect(validateEnv({ ...base, ...mail, MAIL_DEV_ALLOW: 'A@b.co, c@d.co' }).MAIL).toMatchObject({
      port: 465,
      secure: true,
      devAllow: ['a@b.co', 'c@d.co'],
    });
    expect(validateEnv({ ...base, ...mail }).MAIL?.devAllow).toEqual([]);
  });

  it('lets anyone receive mail only in prod', () => {
    expect(validateEnv({ ...base, ...mail, ENV: 'prod' }).MAIL?.devAllow).toBeNull();
  });

  it('port 587 means STARTTLS unless MAIL_SECURE says otherwise', () => {
    expect(validateEnv({ ...base, ...mail, MAIL_PORT: '587' }).MAIL?.secure).toBe(false);
  });

  it('prod over STARTTLS requires TLS; port 465 and dev (Mailpit) do not', () => {
    const tls = (extra: Record<string, string>) => validateEnv({ ...base, ...mail, ...extra }).MAIL?.requireTls;
    expect(tls({ ENV: 'prod', MAIL_PORT: '587' })).toBe(true);
    expect(tls({ ENV: 'prod' })).toBe(false);
    expect(tls({ MAIL_PORT: '587' })).toBe(false);
  });

  it('the transport gives up on a silent server after SMTP_TIMEOUT_MS', () => {
    const options = smtpOptions(validateEnv({ ...base, ...mail, ENV: 'prod', MAIL_PORT: '587' }).MAIL!);
    expect(options).toMatchObject({
      requireTLS: true,
      connectionTimeout: SMTP_TIMEOUT_MS,
      greetingTimeout: SMTP_TIMEOUT_MS,
      socketTimeout: SMTP_TIMEOUT_MS,
    });
    expect(SMTP_TIMEOUT_MS).toBeLessThanOrEqual(15_000);
  });

  it('rejects a MAIL_HOST without credentials', () => {
    expect(() => validateEnv({ ...base, MAIL_HOST: 'mail.spacemail.com' })).toThrow('MAIL_USER, MAIL_PASS, MAIL_FROM');
  });
});
