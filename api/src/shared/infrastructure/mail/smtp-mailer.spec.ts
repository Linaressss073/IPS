import { DisabledMailer, SmtpMailer } from './smtp-mailer.js';
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

  it('rejects a MAIL_HOST without credentials', () => {
    expect(() => validateEnv({ ...base, MAIL_HOST: 'mail.spacemail.com' })).toThrow('MAIL_USER, MAIL_PASS, MAIL_FROM');
  });
});
