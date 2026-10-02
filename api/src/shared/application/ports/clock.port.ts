/** Port so use cases never call `new Date()` directly and stay testable. */
export interface Clock {
  now(): Date;
}
