import { Logger } from '@nestjs/common';
import { TeamId } from '../../../../shared/domain/index.js';
import { PatientTimelineReader } from '../../application/ports/patient-timeline.port.js';
import { TimelineEntryView } from '../../application/types/patient.types.js';

/**
 * Reads from the primary engine (Mongo) and, if it fails, from the fallback
 * (Postgres, the source of truth): an unavailable read model degrades
 * performance, not availability.
 */
export class FallbackPatientTimelineReader implements PatientTimelineReader {
  private readonly logger = new Logger(FallbackPatientTimelineReader.name);

  constructor(
    private readonly primary: PatientTimelineReader,
    private readonly fallback: PatientTimelineReader,
  ) {}

  async forPatient(
    teamId: TeamId,
    patientId: string,
    options?: { type?: string },
  ): Promise<TimelineEntryView[]> {
    try {
      return await this.primary.forPatient(teamId, patientId, options);
    } catch (error) {
      this.logger.warn(`Timeline read from Postgres, Mongo failed: ${String(error)}`);
      return this.fallback.forPatient(teamId, patientId, options);
    }
  }
}
