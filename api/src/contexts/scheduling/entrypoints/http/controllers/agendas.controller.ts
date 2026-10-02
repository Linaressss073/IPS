import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { TeamId } from '../../../../../shared/domain/index.js';
import { AuthenticatedUser } from '../../../../identity-access/domain/entities/authenticated-user.entity.js';
import {
  CurrentTeam,
  CurrentUser,
} from '../../../../identity-access/entrypoints/http/decorators/auth.decorators.js';
import { RequirePermission } from '../../../../staff/entrypoints/http/guards/permission.guard.js';
import { DeleteAgenda } from '../../../application/commands/delete-agenda.command.js';
import { OpenAgenda } from '../../../application/commands/open-agenda.command.js';
import { GetDayAgenda } from '../../../application/queries/scheduling.queries.js';
import { AgendaView } from '../../../application/types/scheduling.types.js';
import { DayAgendaQueryDto, OpenAgendaDto } from '../dto/scheduling.dto.js';
import { toActor } from '../mapping/actor.mapper.js';

/** Professionals' agendas, split into slots (Colombian local time). */
@Controller('teams/:teamId/agendas')
export class AgendasController {
  constructor(
    private readonly getDayAgenda: GetDayAgenda,
    private readonly openAgenda: OpenAgenda,
    private readonly deleteAgenda: DeleteAgenda,
  ) {}

  @RequirePermission('appointments:read')
  @Get()
  day(@CurrentTeam() teamId: TeamId, @Query() query: DayAgendaQueryDto): Promise<AgendaView[]> {
    return this.getDayAgenda.execute({
      teamId,
      date: query.date,
      professionalId: query.professionalId,
      serviceId: query.serviceId,
    });
  }

  @RequirePermission('appointments:manage')
  @Post()
  open(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: OpenAgendaDto,
  ): Promise<{ id: string }> {
    const { requestedBy, ...input } = dto;
    return this.openAgenda.execute({ ...input, teamId, actor: toActor(user.userId, requestedBy) });
  }

  @RequirePermission('appointments:manage')
  @Delete(':agendaId')
  @HttpCode(204)
  remove(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Param('agendaId') agendaId: string,
  ): Promise<void> {
    return this.deleteAgenda.execute({ teamId, agendaId, actor: toActor(user.userId) });
  }
}
