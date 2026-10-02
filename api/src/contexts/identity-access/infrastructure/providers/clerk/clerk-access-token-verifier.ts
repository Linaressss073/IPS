import { verifyToken } from '@clerk/backend';
import { TeamId, UserId } from '../../../../../shared/domain/index.js';
import { AccessTokenVerifier } from '../../../application/ports/access-token-verifier.port.js';
import { normalizeRole } from '../../../domain/constants/roles.js';
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

      const organization = activeOrganization(payload);
      return new AuthenticatedUser(
        UserId.of(payload.sub),
        organization ? TeamId.of(organization.id) : null,
        organization?.role ?? null,
      );
    } catch {
      return null;
    }
  }
}

/**
 * Active organization and the caller's role in it: `o.id` / `o.rol` in v2
 * session tokens, `org_id` / `org_role` in v1.
 */
function activeOrganization(
  payload: object,
): { id: string; role: string | null } | null {
  const claims = payload as {
    o?: { id?: unknown; rol?: unknown };
    org_id?: unknown;
    org_role?: unknown;
  };
  const id = claims.o?.id ?? claims.org_id;
  if (typeof id !== 'string' || !id) return null;
  const role = claims.o?.rol ?? claims.org_role;
  return { id, role: normalizeRole(typeof role === 'string' ? role : null) };
}
