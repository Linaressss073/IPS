import { PATIENT_COMPANION_RECORDED } from '../constants/trace-event-types.js';
import { toCompanionView } from '../mappings/companion.mapper.js';
import { PatientTimelineReader } from '../ports/patient-timeline.port.js';
import { CompanionView, PatientRef } from '../types/patient.types.js';
import { GetPatient } from './get-patient.query.js';

/** Every companion the patient has had, most recent (highest number) first. */
export class GetPatientCompanions {
  constructor(
    private readonly getPatient: GetPatient,
    private readonly timeline: PatientTimelineReader,
  ) {}

  async execute(ref: PatientRef): Promise<{ history: CompanionView[] }> {
    const patient = await this.getPatient.execute(ref);
    const entries = await this.timeline.forPatient(ref.teamId, patient.id, {
      type: PATIENT_COMPANION_RECORDED,
    });
    return {
      history: entries
        .map(toCompanionView)
        .sort((a, b) => b.number - a.number),
    };
  }
}
