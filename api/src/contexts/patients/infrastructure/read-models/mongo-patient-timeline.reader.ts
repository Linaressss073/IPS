import type { Db } from 'mongodb';
import { TeamId } from '../../../../shared/domain/index.js';
import {
  TRACE_EVENTS_COLLECTION,
  TraceEventDocument,
} from '../../../../shared/infrastructure/persistence/mongo.js';
import { PatientTimelineReader } from '../../application/ports/patient-timeline.port.js';
import { TimelineEntryView } from '../../application/types/patient.types.js';

/** The patient's trace events, straight from the append-only log. */
export class MongoPatientTimelineReader implements PatientTimelineReader {
  constructor(private readonly db: Db) {}

  async forPatient(
    teamId: TeamId,
    patientId: string,
    options: { type?: string } = {},
  ): Promise<TimelineEntryView[]> {
    const documents = await this.db
      .collection<TraceEventDocument>(TRACE_EVENTS_COLLECTION)
      .find({
        teamId: teamId.value,
        patientId,
        ...(options.type ? { type: options.type } : {}),
      })
      .sort({ occurredAt: 1, seq: 1 })
      .toArray();

    return documents.map((doc) => ({
      id: doc._id,
      type: doc.type,
      occurredAt: doc.occurredAt.toISOString(),
      requestedBy: doc.requestedBy,
      executedBy: doc.executedBy,
      requestedByName: null,
      executedByName: null,
      data: doc.data,
    }));
  }
}
