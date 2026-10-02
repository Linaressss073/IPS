import { withActorNames } from '../mappings/actor-names.mapper.js';
import { PatientTimelineReader } from '../ports/patient-timeline.port.js';
import { StaffNames } from '../ports/staff-names.port.js';
import { PatientRef, TimelineEntryView } from '../types/patient.types.js';
import { GetPatient } from './get-patient.query.js';

/**
 * "What happened to this patient": every traced step, oldest first.
 * The patient must exist in the team, so another team's id gets a 404.
 */
export class GetPatientTimeline {
  constructor(
    private readonly getPatient: GetPatient,
    private readonly timeline: PatientTimelineReader,
    private readonly staffNames: StaffNames,
  ) {}

  async execute(ref: PatientRef): Promise<TimelineEntryView[]> {
    const patient = await this.getPatient.execute(ref);
    const entries = await this.timeline.forPatient(ref.teamId, patient.id);
    return withActorNames(entries, this.staffNames);
  }
}
