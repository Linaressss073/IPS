/**
 * Port: display names of the users who requested or executed a traced
 * change. Implemented with the Staff context's public query; unknown ids are
 * absent from the map.
 */
export interface StaffNames {
  namesFor(userIds: readonly string[]): Promise<Map<string, string>>;
}
