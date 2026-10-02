import { PatientId } from '../../domain/entities/patient-id.vo.js';
import { PatientNotFoundError } from '../errors/patient.errors.js';
import { PatientReadModel } from '../ports/patient-read-model.port.js';
import { PatientRef, PatientView } from '../types/patient.types.js';

/** The patient's current data, straight from the read model. */
export class GetPatient {
  constructor(private readonly readModel: PatientReadModel) {}

  async execute(ref: PatientRef): Promise<PatientView> {
    const id = PatientId.of(ref.patientId);
    const view = await this.readModel.findById(ref.teamId, id.value);
    if (!view) throw new PatientNotFoundError(id);
    return view;
  }
}
