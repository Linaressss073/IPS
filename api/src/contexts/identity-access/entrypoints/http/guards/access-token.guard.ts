import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ACCESS_TOKEN_VERIFIER } from '../../../application/constants/injection-tokens.js';
import type { AccessTokenVerifier } from '../../../application/ports/access-token-verifier.port.js';
import { AuthenticatedRequest } from './authenticated-request.js';

/** Requires `Authorization: Bearer <Hexclave access token>`. */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    @Inject(ACCESS_TOKEN_VERIFIER)
    private readonly verifier: AccessTokenVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const user = await this.verifier.verify(token);
    if (!user) throw new UnauthorizedException('Invalid or expired token');

    request.auth = user;
    return true;
  }
}
