import type { Db } from 'mongodb';
import { TeamId } from '../../../../shared/domain/index.js';
import {
  TIMELINE_COLLECTION,
  TimelineDocument,
} from '../../../../shared/infrastructure/persistence/mongo.js';
import { PatientTimelineReader } from '../../application/ports/patient-timeline.port.js';
import { TimelineEntryView } from '../../application/types/patient.types.js';

/**
 * Timeline from the Mongo read model. It lags Postgres by up to one relay
 * interval (RELAY_INTERVAL_MS), so a just-made change may not show yet.
 */
export class MongoPatientTimelineReader implements PatientTimelineReader {
  constructor(private readonly mongo: Db) {}

  async forPatient(
    teamId: TeamId,
    patientId: string,
    options: { type?: string } = {},
  ): Promise<TimelineEntryView[]> {
    const documents = await this.mongo
      .collection<TimelineDocument>(TIMELINE_COLLECTION)
      .find({
        teamId: teamId.value,
        patientId,
        ...(options.type ? { type: options.type } : {}),
      })
      .sort({ occurredAt: 1, position: 1 })
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
