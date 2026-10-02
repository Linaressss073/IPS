import { InvalidValueError } from '../../../../shared/domain/index.js';
import { maskEmail } from '../utils/mask-email.js';
import { StaffProfile } from './staff-profile.vo.js';

const at = new Date('2026-10-02T07:09:33.596Z');

describe('maskEmail', () => {
  it('hides the user, the domain and the top-level domain', () => {
    expect(maskEmail('andres.gomez@clinica.com.co')).toBe('and****@cli***.c**');
    expect(maskEmail('  Ana.Maria@Gmail.COM ')).toBe('ana****@gma***.c**');
  });

  it('never reveals a whole short part and keeps masks of fixed length', () => {
    expect(maskEmail('jo@x.co')).toBe('j****@***.c**');
    expect(maskEmail('a@hospital.org')).toBe('****@hos***.o**');
  });

  it('returns null for anything that is not an e-mail', () => {
    expect(maskEmail(null)).toBeNull();
    expect(maskEmail('no-at-sign')).toBeNull();
    expect(maskEmail('@hospital.org')).toBeNull();
    expect(maskEmail('x@localhost')).toBeNull();
  });
});

describe('StaffProfile', () => {
  it('keeps only a display name and the masked e-mail', () => {
    const profile = StaffProfile.of({
      userId: 'user_2abc',
      firstName: ' Ana ',
      lastName: 'Gómez',
      username: 'agomez',
      email: 'ana.gomez@clinica.com.co',
      sourceUpdatedAt: at,
    });
    expect(profile.value).toEqual({
      userId: 'user_2abc',
      displayName: 'Ana Gómez',
      emailMasked: 'ana****@cli***.c**',
      sourceUpdatedAt: at,
    });
  });

  it('falls back to the username, then to no name at all', () => {
    expect(
      StaffProfile.of({ userId: 'u1', username: 'agomez', sourceUpdatedAt: at })
        .displayName,
    ).toBe('agomez');
    expect(
      StaffProfile.of({ userId: 'u1', sourceUpdatedAt: at }).displayName,
    ).toBeNull();
  });

  it('requires a user id', () => {
    expect(() => StaffProfile.of({ userId: ' ', sourceUpdatedAt: at })).toThrow(
      InvalidValueError,
    );
  });
});
