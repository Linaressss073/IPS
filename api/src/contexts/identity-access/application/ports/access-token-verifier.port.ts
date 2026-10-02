import { AuthenticatedUser } from '../../domain/entities/authenticated-user.entity.js';

/** Port: turns a bearer token into an AuthenticatedUser, or null if invalid. */
export interface AccessTokenVerifier {
  verify(token: string): Promise<AuthenticatedUser | null>;
}
