import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { TeamId } from '../../../../../shared/domain/index.js';
import { AuthenticatedUser } from '../../../../identity-access/domain/entities/authenticated-user.entity.js';
import {
  CurrentTeam,
  CurrentUser,
  TeamAdmin,
  TeamScoped,
} from '../../../../identity-access/entrypoints/http/decorators/auth.decorators.js';
import { DeleteOrganization } from '../../../application/commands/delete-organization.command.js';
import { UpdateOrganization } from '../../../application/commands/update-organization.command.js';
import { GetOrganization } from '../../../application/queries/get-organization.query.js';
import { OrganizationView } from '../../../application/types/organization.types.js';
import { UpdateOrganizationDto } from '../dto/organization.dto.js';

/**
 * The IPS itself (`:teamId` is its organization id). Any member can read it;
 * only its administrators can change or delete it.
 */
@Controller('organizations/:teamId')
export class OrganizationsController {
  constructor(
    private readonly getOrganization: GetOrganization,
    private readonly updateOrganization: UpdateOrganization,
    private readonly deleteOrganization: DeleteOrganization,
  ) {}

  @Get()
  @TeamScoped()
  get(@CurrentTeam() teamId: TeamId): Promise<OrganizationView> {
    return this.getOrganization.execute({ teamId });
  }

  @Patch()
  @TeamAdmin()
  update(
    @CurrentTeam() teamId: TeamId,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<OrganizationView> {
    const { version, name, ...profile } = dto;
    return this.updateOrganization.execute({
      teamId,
      expectedVersion: version,
      name,
      profile,
    });
  }

  @Delete()
  @TeamAdmin()
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.deleteOrganization.execute({
      teamId,
      deletedBy: user.userId.value,
    });
  }
}
