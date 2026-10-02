import { verifyToken } from '@clerk/backend';
import { TeamId, UserId } from '../../../../../shared/domain/index.js';
import { AccessTokenVerifier } from '../../../application/ports/access-token-verifier.port.js';
import { AuthenticatedUser } from '../../../domain/entities/authenticated-user.entity.js';

/**
 * Verifies Clerk session tokens (RS256 JWTs) against the instance's JWKS.
 * With a JWT key no network call is made; with only the secret key the keys
 * are fetched once and cached by the SDK. `authorizedParties` rejects tokens
 * minted for other origins (the `azp` claim must be one of our frontends).
 */
export class ClerkAccessTokenVerifier implements AccessTokenVerifier {
  constructor(
    private readonly options: {
      secretKey: string;
      jwtKey?: string;
      authorizedParties: string[];
    },
  ) {}

  async verify(token: string): Promise<AuthenticatedUser | null> {
    try {
      const payload = await verifyToken(token, {
        secretKey: this.options.secretKey,
        jwtKey: this.options.jwtKey,
        authorizedParties: this.options.authorizedParties,
      });
      if (!payload.sub) return null;

      const organizationId = activeOrganizationId(payload);
      return new AuthenticatedUser(
        UserId.of(payload.sub),
        organizationId ? TeamId.of(organizationId) : null,
      );
    } catch {
      return null;
    }
  }
}

/** Active organization: `o.id` in v2 session tokens, `org_id` in v1. */
function activeOrganizationId(payload: object): string | null {
  const claims = payload as { o?: { id?: unknown }; org_id?: unknown };
  const id = claims.o?.id ?? claims.org_id;
  return typeof id === 'string' && id ? id : null;
}
