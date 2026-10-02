import { TeamId } from '../../../../shared/domain/index.js';
import { PatientView } from '../../application/types/patient.types.js';
import { Affiliation } from '../../domain/entities/affiliation.vo.js';
import { BiologicalSex } from '../../domain/entities/biological-sex.vo.js';
import { BirthDate } from '../../domain/entities/birth-date.vo.js';
import { ContactInfo } from '../../domain/entities/contact-info.vo.js';
import { IdentityDocument } from '../../domain/entities/identity-document.vo.js';
import { PatientId } from '../../domain/entities/patient-id.vo.js';
import { Patient } from '../../domain/entities/patient.entity.js';
import { PersonName } from '../../domain/entities/person-name.vo.js';
import { PatientRow } from './patient.schema.js';
import { normalizeForSearch } from './search-text.js';

/** Translates between the Patient aggregate, its row and its read model. */
export const PatientMapper = {
  toDomain(row: PatientRow): Patient {
    return Patient.restore(PatientId.of(row.id), {
      teamId: TeamId.of(row.teamId),
      document: IdentityDocument.of(row.documentType, row.documentNumber),
      name: PersonName.of(row),
      birthDate: BirthDate.of(row.birthDate),
      sex: BiologicalSex.of(row.sex),
      contact: ContactInfo.of(row),
      affiliation: Affiliation.of(row),
      version: row.version,
      registeredAt: row.registeredAt,
      updatedAt: row.updatedAt,
    });
  },

  toPersistence(patient: Patient): PatientRow {
    const { name } = patient;
    return {
      id: patient.id.value,
      teamId: patient.teamId.value,
      documentType: patient.document.type,
      documentNumber: patient.document.number,
      firstName: name.firstName,
      middleName: name.middleName,
      firstLastName: name.firstLastName,
      secondLastName: name.secondLastName,
      birthDate: patient.birthDate.value,
      sex: patient.sex.value,
      email: patient.contact.email,
      phone: patient.contact.phone,
      address: patient.contact.address,
      eps: patient.affiliation.eps,
      regime: patient.affiliation.regime,
      searchText: normalizeForSearch(
        `${patient.document.number} ${name.fullName}`,
      ),
      version: patient.version,
      registeredAt: patient.registeredAt,
      updatedAt: patient.updatedAt,
    };
  },

  /** Read side: row -> view without going through the domain. */
  toView(row: PatientRow): PatientView {
    const name = {
      firstName: row.firstName,
      middleName: row.middleName,
      firstLastName: row.firstLastName,
      secondLastName: row.secondLastName,
    };
    return {
      id: row.id,
      document: { type: row.documentType, number: row.documentNumber },
      name,
      fullName: Object.values(name).filter(Boolean).join(' '),
      birthDate: row.birthDate,
      sex: row.sex,
      contact: { email: row.email, phone: row.phone, address: row.address },
      affiliation: { eps: row.eps, regime: row.regime },
      version: row.version,
      registeredAt: row.registeredAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  },
};
