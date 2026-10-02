import { createRemoteJWKSet, jwtVerify } from 'jose';
import { TeamId, UserId, isUuid } from '../../../../../shared/domain/index.js';
import { AccessTokenVerifier } from '../../../application/ports/access-token-verifier.port.js';
import { AuthenticatedUser } from '../../../domain/entities/authenticated-user.entity.js';

/**
 * Verifies Hexclave access tokens (ES256 JWTs) locally against the project's
 * public JWKS: no network round-trip per request once the keys are cached.
 * Anonymous-user tokens are rejected because they are signed by a different
 * issuer that this verifier does not trust.
 */
export class HexclaveAccessTokenVerifier implements AccessTokenVerifier {
  private readonly issuer: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(apiUrl: string, projectId: string) {
    this.issuer = new URL(`/api/v1/projects/${projectId}`, apiUrl).toString();
    this.jwks = createRemoteJWKSet(
      new URL(`/api/v1/projects/${projectId}/.well-known/jwks.json`, apiUrl),
    );
  }

  async verify(token: string): Promise<AuthenticatedUser | null> {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        algorithms: ['ES256'],
      });
      if (!payload.sub) return null;

      const selectedTeam = payload.selected_team_id;
      return new AuthenticatedUser(
        UserId.of(payload.sub),
        typeof selectedTeam === 'string' && isUuid(selectedTeam)
          ? TeamId.of(selectedTeam)
          : null,
      );
    } catch {
      return null;
    }
  }
}
