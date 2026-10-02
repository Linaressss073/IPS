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
import { PatientDocument } from './patient.document.js';
import { normalizeForSearch } from './search-text.js';

/** The patient's fields as stored; the companion counter is kept apart. */
export type PatientFields = Omit<PatientDocument, 'companionCount'>;

/** Translates between the Patient aggregate, its document and its read model. */
export const PatientMapper = {
  toDomain(doc: PatientFields): Patient {
    return Patient.restore(PatientId.of(doc._id), {
      teamId: TeamId.of(doc.teamId),
      document: IdentityDocument.of(doc.document.type, doc.document.number),
      name: PersonName.of(doc.name),
      birthDate: BirthDate.of(doc.birthDate),
      sex: BiologicalSex.of(doc.sex),
      contact: ContactInfo.of(doc.contact),
      affiliation: Affiliation.of(doc.affiliation),
      version: doc.version,
      registeredAt: doc.registeredAt,
      updatedAt: doc.updatedAt,
    });
  },

  toPersistence(patient: Patient): PatientFields {
    const { name } = patient;
    return {
      _id: patient.id.value,
      teamId: patient.teamId.value,
      document: { type: patient.document.type, number: patient.document.number },
      name: {
        firstName: name.firstName,
        middleName: name.middleName,
        firstLastName: name.firstLastName,
        secondLastName: name.secondLastName,
      },
      birthDate: patient.birthDate.value,
      sex: patient.sex.value,
      contact: {
        email: patient.contact.email,
        phone: patient.contact.phone,
        address: patient.contact.address,
      },
      affiliation: {
        eps: patient.affiliation.eps,
        regime: patient.affiliation.regime,
      },
      searchText: normalizeForSearch(
        `${patient.document.number} ${name.fullName}`,
      ),
      version: patient.version,
      registeredAt: patient.registeredAt,
      updatedAt: patient.updatedAt,
    };
  },

  /** Read side: document -> view without going through the domain. */
  toView(doc: PatientFields): PatientView {
    const { name } = doc;
    return {
      id: doc._id,
      document: { ...doc.document },
      name: { ...name },
      fullName: Object.values(name).filter(Boolean).join(' '),
      birthDate: doc.birthDate,
      sex: doc.sex,
      contact: { ...doc.contact },
      affiliation: { ...doc.affiliation },
      version: doc.version,
      registeredAt: doc.registeredAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  },
};
