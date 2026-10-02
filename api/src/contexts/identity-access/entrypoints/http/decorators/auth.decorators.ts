import {
  createParamDecorator,
  ExecutionContext,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../guards/access-token.guard.js';
import { AuthenticatedRequest } from '../guards/authenticated-request.js';
import { TeamMemberGuard } from '../guards/team-member.guard.js';

/** Protects a controller whose routes are nested under `/teams/:teamId`. */
export const TeamScoped = () => UseGuards(AccessTokenGuard, TeamMemberGuard);

export const Authenticated = () => UseGuards(AccessTokenGuard);

/** The TeamId resolved by TeamMemberGuard. */
export const CurrentTeam = createParamDecorator(
  (_: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().teamId,
);

/** The AuthenticatedUser resolved by AccessTokenGuard. */
export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().auth,
);
