import {
  Actor,
  newTraceEvent,
  TraceEvent,
} from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import { Companion } from '../../domain/entities/companion.vo.js';
import { CompanionData } from '../../domain/types/patient.types.js';
import { PATIENT_COMPANION_RECORDED } from '../constants/trace-event-types.js';
import { CompanionView, TimelineEntryView } from '../types/patient.types.js';

/** The "companion recorded" trace event: the companion plus its number. */
export function companionRecordedEvent(input: {
  teamId: TeamId;
  patientId: string;
  companion: Companion;
  number: number;
  actor: Actor;
  occurredAt: Date;
}): TraceEvent {
  return newTraceEvent({
    teamId: input.teamId,
    patientId: input.patientId,
    type: PATIENT_COMPANION_RECORDED,
    actor: input.actor,
    occurredAt: input.occurredAt,
    data: { number: input.number, ...input.companion.value },
  });
}

/** Timeline entry of a "companion recorded" event -> companion read model. */
export function toCompanionView(entry: TimelineEntryView): CompanionView {
  const data = entry.data as unknown as CompanionData & { number: number };
  return {
    number: data.number,
    relationship: data.relationship,
    name: data.name,
    fullName: data.name
      ? [
          data.name.firstName,
          data.name.middleName,
          data.name.firstLastName,
          data.name.secondLastName,
        ]
          .filter(Boolean)
          .join(' ')
      : null,
    document: data.document,
    phone: data.phone,
    email: data.email,
    recordedAt: entry.occurredAt,
    requestedBy: entry.requestedBy,
    executedBy: entry.executedBy,
  };
}
