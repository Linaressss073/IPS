import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TeamId } from '../../../../../shared/domain/index.js';
import { AuthenticatedUser } from '../../../../identity-access/domain/entities/authenticated-user.entity.js';
import {
  CurrentTeam,
  CurrentUser,
} from '../../../../identity-access/entrypoints/http/decorators/auth.decorators.js';
import { RequirePermission } from '../../../../staff/entrypoints/http/guards/permission.guard.js';
import { CreateLocation } from '../../../application/commands/create-location.command.js';
import { CreateService } from '../../../application/commands/create-service.command.js';
import { UpdateLocation } from '../../../application/commands/update-location.command.js';
import { UpdateService } from '../../../application/commands/update-service.command.js';
import {
  ListLocations,
  ListProfessionals,
  ListServices,
} from '../../../application/queries/scheduling.queries.js';
import {
  LocationView,
  ProfessionalView,
  ServiceView,
} from '../../../application/types/scheduling.types.js';
import {
  CreateLocationDto,
  CreateServiceDto,
  UpdateLocationDto,
  UpdateServiceDto,
} from '../dto/scheduling.dto.js';
import { toActor } from '../mapping/actor.mapper.js';

/**
 * What agendas are built from: services (with their turn prefix),
 * locations and professionals. Anyone who sees agendas can read them;
 * only administrators (settings:manage) change them.
 */
@Controller('teams/:teamId')
export class SchedulingSettingsController {
  constructor(
    private readonly listServices: ListServices,
    private readonly createService: CreateService,
    private readonly updateService: UpdateService,
    private readonly listLocations: ListLocations,
    private readonly createLocation: CreateLocation,
    private readonly updateLocation: UpdateLocation,
    private readonly listProfessionals: ListProfessionals,
  ) {}

  @RequirePermission('appointments:read')
  @Get('services')
  services(@CurrentTeam() teamId: TeamId): Promise<ServiceView[]> {
    return this.listServices.execute(teamId);
  }

  @RequirePermission('settings:manage')
  @Post('services')
  addService(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateServiceDto,
  ): Promise<ServiceView> {
    const { requestedBy, ...input } = dto;
    return this.createService.execute({ ...input, teamId, actor: toActor(user.userId, requestedBy) });
  }

  @RequirePermission('settings:manage')
  @Patch('services/:serviceId')
  changeService(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Param('serviceId') serviceId: string,
    @Body() dto: UpdateServiceDto,
  ): Promise<ServiceView> {
    const { requestedBy, ...changes } = dto;
    return this.updateService.execute({
      ...changes,
      teamId,
      serviceId,
      actor: toActor(user.userId, requestedBy),
    });
  }

  @RequirePermission('appointments:read')
  @Get('locations')
  locations(@CurrentTeam() teamId: TeamId): Promise<LocationView[]> {
    return this.listLocations.execute(teamId);
  }

  @RequirePermission('settings:manage')
  @Post('locations')
  addLocation(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLocationDto,
  ): Promise<LocationView> {
    const { requestedBy, ...input } = dto;
    return this.createLocation.execute({ ...input, teamId, actor: toActor(user.userId, requestedBy) });
  }

  @RequirePermission('settings:manage')
  @Patch('locations/:locationId')
  changeLocation(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Param('locationId') locationId: string,
    @Body() dto: UpdateLocationDto,
  ): Promise<LocationView> {
    return this.updateLocation.execute({
      teamId,
      locationId,
      active: dto.active,
      actor: toActor(user.userId, dto.requestedBy),
    });
  }

  @RequirePermission('appointments:read')
  @Get('professionals')
  professionals(@CurrentTeam() teamId: TeamId): Promise<ProfessionalView[]> {
    return this.listProfessionals.execute(teamId);
  }
}
