import { TeamId } from '../../../../shared/domain/index.js';
import { TimelineEntryView } from '../types/patient.types.js';

/**
 * Port (read side): the journey of a patient, oldest first, from the
 * append-only trace events.
 */
export interface PatientTimelineReader {
  /** `type` keeps only the events of that type (e.g. companions). */
  forPatient(
    teamId: TeamId,
    patientId: string,
    options?: { type?: string },
  ): Promise<TimelineEntryView[]>;
}
