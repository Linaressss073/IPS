import { IdentityChange } from '../types/staff.types.js';

/** Port: every current user and membership of the provider, for a bulk sync. */
export interface IdentitySource {
  snapshot(): AsyncIterable<IdentityChange>;
}
