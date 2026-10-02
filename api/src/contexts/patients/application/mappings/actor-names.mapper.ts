import { StaffNames } from '../ports/staff-names.port.js';
import { TimelineEntryView } from '../types/patient.types.js';

/** Adds the requester's and executor's display names to timeline entries. */
export async function withActorNames(
  entries: TimelineEntryView[],
  staffNames: StaffNames,
): Promise<TimelineEntryView[]> {
  const names = await staffNames.namesFor(
    entries.flatMap((entry) => [entry.requestedBy, entry.executedBy]),
  );
  return entries.map((entry) => ({
    ...entry,
    requestedByName: names.get(entry.requestedBy) ?? null,
    executedByName: names.get(entry.executedBy) ?? null,
  }));
}
