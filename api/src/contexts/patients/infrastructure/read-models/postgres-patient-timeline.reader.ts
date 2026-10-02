import { and, asc, eq } from 'drizzle-orm';
import { TeamId } from '../../../../shared/domain/index.js';
import { Database } from '../../../../shared/infrastructure/persistence/database.module.js';
import { traceEvents } from '../../../../shared/infrastructure/persistence/trace-events.schema.js';
import { PatientTimelineReader } from '../../application/ports/patient-timeline.port.js';
import { TimelineEntryView } from '../../application/types/patient.types.js';

/** Timeline straight from the trace events in Postgres (always up to date). */
export class PostgresPatientTimelineReader implements PatientTimelineReader {
  constructor(private readonly db: Database) {}

  async forPatient(
    teamId: TeamId,
    patientId: string,
    options: { type?: string } = {},
  ): Promise<TimelineEntryView[]> {
    const rows = await this.db
      .select()
      .from(traceEvents)
      .where(
        and(
          eq(traceEvents.teamId, teamId.value),
          eq(traceEvents.patientId, patientId),
          options.type ? eq(traceEvents.type, options.type) : undefined,
        ),
      )
      .orderBy(asc(traceEvents.occurredAt), asc(traceEvents.position));

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      occurredAt: row.occurredAt.toISOString(),
      requestedBy: row.requestedBy,
      executedBy: row.executedBy,
      data: row.data,
    }));
  }
}
