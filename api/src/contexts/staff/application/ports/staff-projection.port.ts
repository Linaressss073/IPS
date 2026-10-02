/**
 * Port: read-only copy of the staff directory in MongoDB (`staff`
 * collection), with the same minimization as the source (name, masked
 * e-mail, roles). Each refresh rebuilds the users' documents from the
 * source of truth, so it is idempotent and order-independent.
 */
export interface StaffProjection {
  refresh(userIds: readonly string[]): Promise<void>;

  /** Rebuilds every document (first setup or recovery); returns how many. */
  rebuildAll(): Promise<number>;
}
