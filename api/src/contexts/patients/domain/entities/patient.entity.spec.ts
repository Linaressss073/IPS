import {
  InvalidValueError,
  TeamId,
} from '../../../../shared/domain/index.js';
import { BirthDateOutOfRangeError } from '../errors/patient.errors.js';
import { Affiliation } from './affiliation.vo.js';
import { BiologicalSex } from './biological-sex.vo.js';
import { BirthDate } from './birth-date.vo.js';
import { Companion } from './companion.vo.js';
import { ContactInfo } from './contact-info.vo.js';
import { IdentityDocument } from './identity-document.vo.js';
import { Patient } from './patient.entity.js';
import { PersonName } from './person-name.vo.js';

const now = new Date('2026-10-01T12:00:00Z');
const teamId = TeamId.of('7c9e6679-7425-40de-944b-e07fc1f90ae7');

const register = (birthDate = '1990-05-20') =>
  Patient.register({
    teamId,
    now,
    document: IdentityDocument.of('CC', '1000123456'),
    name: PersonName.of({ firstName: 'Andrés', firstLastName: 'Gómez' }),
    birthDate: BirthDate.of(birthDate),
    sex: BiologicalSex.of('H'),
    contact: ContactInfo.of({ email: 'andres@example.com' }),
    affiliation: Affiliation.of({ eps: 'Sanitas', regime: 'contributivo' }),
  });

describe('Patient value objects', () => {
  it('normalizes Colombian documents and rejects unknown types', () => {
    expect(IdentityDocument.of('cc', '1.000.123.456').toString()).toBe(
      'CC 1000123456',
    );
    expect(IdentityDocument.of('NIT', '900.123.456-7').number).toBe(
      '9001234567',
    );
    expect(IdentityDocument.of('PA', 'ab12345').number).toBe('AB12345');
    expect(() => IdentityDocument.of('DNI', '123456')).toThrow(
      InvalidValueError,
    );
    expect(() => IdentityDocument.of('CC', 'AB12345')).toThrow(
      'A CC number can only contain digits',
    );
  });

  it('requires first name and first last name, trimming the rest', () => {
    const name = PersonName.of({
      firstName: '  María  José ',
      middleName: '',
      firstLastName: 'Peña',
      secondLastName: "D'Costa",
    });
    expect(name.value).toEqual({
      firstName: 'María José',
      middleName: null,
      firstLastName: 'Peña',
      secondLastName: "D'Costa",
    });
    expect(name.fullName).toBe("María José Peña D'Costa");
    expect(() =>
      PersonName.of({ firstName: ' ', firstLastName: 'Gómez' }),
    ).toThrow('First name is required');
    expect(() =>
      PersonName.of({ firstName: 'R2D2', firstLastName: 'Gómez' }),
    ).toThrow(InvalidValueError);
  });

  it('requires an e-mail; phone and address are optional', () => {
    expect(
      ContactInfo.of({ email: ' Andres@Example.com ', phone: '(601) 555-1234' })
        .value,
    ).toEqual({ email: 'andres@example.com', phone: '6015551234', address: null });
    expect(() => ContactInfo.of({ email: '' })).toThrow(InvalidValueError);
    expect(() =>
      ContactInfo.of({ email: 'a@b.co', phone: '12' }),
    ).toThrow(InvalidValueError);
  });

  it('requires an EPS except for "particular" patients', () => {
    expect(Affiliation.of({ regime: 'particular' }).eps).toBeNull();
    expect(() => Affiliation.of({ regime: 'subsidiado' })).toThrow(
      'The "subsidiado" regime requires an EPS',
    );
    expect(() =>
      Affiliation.of({ eps: 'Sanitas', regime: 'particular' }),
    ).toThrow('A "particular" patient has no EPS');
  });

  it('accepts only real calendar dates', () => {
    expect(BirthDate.of('2024-02-29').value).toBe('2024-02-29');
    expect(() => BirthDate.of('2026-02-30')).toThrow(InvalidValueError);
    expect(() => BirthDate.of('20/05/1990')).toThrow(InvalidValueError);
    expect(BirthDate.of('1990-10-02').ageAt(now)).toBe(35);
    expect(BirthDate.of('1990-10-01').ageAt(now)).toBe(36);
  });
});

describe('Companion', () => {
  it('accepts a name or a phone, everything else optional', () => {
    expect(
      Companion.of({
        relationship: 'Madre',
        name: { firstName: 'María', firstLastName: 'Torres' },
        document: { type: 'cc', number: '52.000.111' },
      }).value,
    ).toEqual({
      relationship: 'madre',
      name: {
        firstName: 'María',
        middleName: null,
        firstLastName: 'Torres',
        secondLastName: null,
      },
      document: { type: 'CC', number: '52000111' },
      phone: null,
      email: null,
    });
    expect(Companion.of({ phone: '300 123 4567' }).value.phone).toBe(
      '3001234567',
    );
  });

  it('rejects a companion with neither name nor phone', () => {
    expect(() =>
      Companion.of({ document: { type: 'CC', number: '52000111' } }),
    ).toThrow('A companion needs at least a name or a phone');
    expect(() => Companion.of({})).toThrow(InvalidValueError);
  });

  it('rejects an unknown relationship', () => {
    expect(() =>
      Companion.of({ phone: '3001234567', relationship: 'jefe' }),
    ).toThrow(InvalidValueError);
  });
});

describe('Patient', () => {
  it('is registered with version 1', () => {
    const patient = register();
    expect(patient.version).toBe(1);
    expect(patient.registeredAt).toEqual(now);
  });

  it('rejects a birth date in the future or more than 130 years ago', () => {
    expect(() => register('2026-10-02')).toThrow(BirthDateOutOfRangeError);
    expect(() => register('1890-01-01')).toThrow(BirthDateOutOfRangeError);
  });

  it('returns only the fields that really changed and bumps the version', () => {
    const patient = register();
    const later = new Date('2026-10-02T09:00:00Z');

    const changes = patient.update(
      {
        name: PersonName.of({ firstName: 'Andrés', firstLastName: 'Gómez' }),
        contact: ContactInfo.of({
          email: 'andres@example.com',
          phone: '3001234567',
        }),
      },
      later,
    );

    expect(changes).toEqual([
      {
        field: 'contact',
        from: { email: 'andres@example.com', phone: null, address: null },
        to: { email: 'andres@example.com', phone: '3001234567', address: null },
      },
    ]);
    expect(patient.version).toBe(2);
    expect(patient.updatedAt).toEqual(later);
  });

  it('keeps the version when nothing changed', () => {
    const patient = register();
    expect(
      patient.update({ sex: BiologicalSex.of('h') }, new Date()),
    ).toEqual([]);
    expect(patient.version).toBe(1);
  });
});
