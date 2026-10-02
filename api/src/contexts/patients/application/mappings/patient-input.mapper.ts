import { Affiliation } from '../../domain/entities/affiliation.vo.js';
import { BiologicalSex } from '../../domain/entities/biological-sex.vo.js';
import { BirthDate } from '../../domain/entities/birth-date.vo.js';
import { ContactInfo } from '../../domain/entities/contact-info.vo.js';
import { IdentityDocument } from '../../domain/entities/identity-document.vo.js';
import { PersonName } from '../../domain/entities/person-name.vo.js';
import { PatientData } from '../../domain/types/patient.types.js';
import { PatientInput } from '../types/patient.types.js';

/** Raw client input -> domain value objects (each one validates itself). */
export const PatientInputMapper = {
  toData(input: PatientInput): PatientData {
    return {
      document: IdentityDocument.of(input.document.type, input.document.number),
      name: PersonName.of(input.name),
      birthDate: BirthDate.of(input.birthDate),
      sex: BiologicalSex.of(input.sex),
      contact: ContactInfo.of(input.contact),
      affiliation: Affiliation.of(input.affiliation),
    };
  },

  /** Only the groups present in the input are converted. */
  toChanges(input: Partial<PatientInput>): Partial<PatientData> {
    return {
      document:
        input.document &&
        IdentityDocument.of(input.document.type, input.document.number),
      name: input.name && PersonName.of(input.name),
      birthDate: input.birthDate ? BirthDate.of(input.birthDate) : undefined,
      sex: input.sex ? BiologicalSex.of(input.sex) : undefined,
      contact: input.contact && ContactInfo.of(input.contact),
      affiliation: input.affiliation && Affiliation.of(input.affiliation),
    };
  },
};
