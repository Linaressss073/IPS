import { Patient } from '../../domain/entities/patient.entity.js';
import { PatientView } from '../types/patient.types.js';

/** Patient aggregate -> read model returned by the commands. */
export function toPatientView(patient: Patient): PatientView {
  return {
    id: patient.id.value,
    document: { type: patient.document.type, number: patient.document.number },
    name: { ...patient.name.value },
    fullName: patient.name.fullName,
    birthDate: patient.birthDate.value,
    sex: patient.sex.value,
    contact: { ...patient.contact.value },
    affiliation: { ...patient.affiliation.value },
    version: patient.version,
    registeredAt: patient.registeredAt.toISOString(),
    updatedAt: patient.updatedAt.toISOString(),
  };
}
