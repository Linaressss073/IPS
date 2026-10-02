import { PatientId } from '../../domain/entities/patient-id.vo.js';
import { Patient } from '../../domain/entities/patient.entity.js';
import { PatientNotFoundError } from '../errors/patient.errors.js';
import { PatientRepository } from '../ports/patient.repository.port.js';
import { PatientRef } from '../types/patient.types.js';

/** Loads a patient of a team or fails with PatientNotFoundError. */
export class PatientFinder {
  constructor(private readonly patients: PatientRepository) {}

  async getOrFail(ref: PatientRef): Promise<Patient> {
    const id = PatientId.of(ref.patientId);
    const patient = await this.patients.findById(ref.teamId, id);
    if (!patient) throw new PatientNotFoundError(id);
    return patient;
  }
}
