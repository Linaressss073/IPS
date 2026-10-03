import { PatientId } from '../../domain/entities/patient-id.vo.js';
import { PatientReadModel } from '../ports/patient-read-model.port.js';
import { PatientRef, PatientView } from '../types/patient.types.js';

/** The patient's current data, straight from the read model. */
export class GetPatient {
  constructor(private readonly readModel: PatientReadModel) {}

  async execute(ref: PatientRef): Promise<PatientView> {
    const id = PatientId.of(ref.patientId);
    return this.readModel.getById(ref.teamId, id.value);
  }
}
