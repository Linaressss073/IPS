import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TEAM_ADMIN_ROLE } from '../../../../identity-access/domain/constants/roles.js';
import { AccessTokenGuard } from '../../../../identity-access/entrypoints/http/guards/access-token.guard.js';
import { AuthenticatedRequest } from '../../../../identity-access/entrypoints/http/guards/authenticated-request.js';
import { TeamMemberGuard } from '../../../../identity-access/entrypoints/http/guards/team-member.guard.js';
import { PermissionDeniedError } from '../../../application/errors/staff.errors.js';
import { AccessService } from '../../../application/services/access.service.js';
import { Permission } from '../../../domain/constants/permissions.js';

const REQUIRED_PERMISSION = 'staff:required-permission';

/**
 * Lets the request through only if the caller's roles in the IPS grant the
 * permission set with @RequirePermission. Runs after TeamMemberGuard.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly access: AccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<Permission>(REQUIRED_PERMISSION, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const allowed = await this.access.allows(
      {
        teamId: request.teamId!,
        userId: request.auth!.userId.value,
        isAdmin: request.teamRole === TEAM_ADMIN_ROLE,
      },
      permission,
    );
    if (!allowed) throw new PermissionDeniedError(permission);
    return true;
  }
}

/** Token + membership of `:teamId` + the given permission. */
export const RequirePermission = (permission: Permission) =>
  applyDecorators(
    SetMetadata(REQUIRED_PERMISSION, permission),
    UseGuards(AccessTokenGuard, TeamMemberGuard, PermissionGuard),
  );
