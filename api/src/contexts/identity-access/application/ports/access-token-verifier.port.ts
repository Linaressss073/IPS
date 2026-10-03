import { AuthenticatedUser } from '../../domain/entities/authenticated-user.entity.js';

/** Port: turns a bearer token into an AuthenticatedUser; throws InvalidAccessTokenError if invalid. */
export interface AccessTokenVerifier {
  verify(token: string): Promise<AuthenticatedUser>;
}
