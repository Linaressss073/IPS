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
 * Lets the request through only if the caller's roles in the IPS grant one
 * of the permissions set with @RequirePermission. Runs after TeamMemberGuard.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly access: AccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.getAllAndOverride<Permission[]>(REQUIRED_PERMISSION, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const access = await this.access.accessOf({
      teamId: request.teamId!,
      userId: request.auth!.userId.value,
      isAdmin: request.teamRole === TEAM_ADMIN_ROLE,
    });
    if (!permissions.some((permission) => access.permissions.includes(permission))) {
      throw new PermissionDeniedError(permissions.join(' | '));
    }
    return true;
  }
}

/** Token + membership of `:teamId` + any one of the given permissions. */
export const RequirePermission = (...permissions: [Permission, ...Permission[]]) =>
  applyDecorators(
    SetMetadata(REQUIRED_PERMISSION, permissions),
    UseGuards(AccessTokenGuard, TeamMemberGuard, PermissionGuard),
  );
