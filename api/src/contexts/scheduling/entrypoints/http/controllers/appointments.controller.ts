import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { TeamId } from '../../../../../shared/domain/index.js';
import { AuthenticatedUser } from '../../../../identity-access/domain/entities/authenticated-user.entity.js';
import {
  CurrentTeam,
  CurrentUser,
} from '../../../../identity-access/entrypoints/http/decorators/auth.decorators.js';
import { RequirePermission } from '../../../../staff/entrypoints/http/guards/permission.guard.js';
import { CancelAppointment } from '../../../application/commands/cancel-appointment.command.js';
import { ConfirmAppointment } from '../../../application/commands/confirm-appointment.command.js';
import { RescheduleAppointment } from '../../../application/commands/reschedule-appointment.command.js';
import { ScheduleAppointment } from '../../../application/commands/schedule-appointment.command.js';
import { GetAppointment } from '../../../application/queries/get-appointment.query.js';
import { SearchAppointments } from '../../../application/queries/search-appointments.query.js';
import { AppointmentView } from '../../../application/types/scheduling.types.js';
import {
  CancelAppointmentDto,
  ChangeAppointmentDto,
  RescheduleAppointmentDto,
  ScheduleAppointmentDto,
  SearchAppointmentsQueryDto,
} from '../dto/scheduling.dto.js';
import { toActor } from '../mapping/actor.mapper.js';

/** Booking, confirming, cancelling and moving appointments. */
@Controller('teams/:teamId/appointments')
export class AppointmentsController {
  constructor(
    private readonly searchAppointments: SearchAppointments,
    private readonly getAppointment: GetAppointment,
    private readonly scheduleAppointment: ScheduleAppointment,
    private readonly confirmAppointment: ConfirmAppointment,
    private readonly cancelAppointment: CancelAppointment,
    private readonly rescheduleAppointment: RescheduleAppointment,
  ) {}

  @RequirePermission('appointments:read')
  @Get()
  search(
    @CurrentTeam() teamId: TeamId,
    @Query() query: SearchAppointmentsQueryDto,
  ): Promise<AppointmentView[]> {
    return this.searchAppointments.execute({
      teamId,
      date: query.date,
      patientId: query.patientId,
      professionalId: query.professionalId,
      status: query.status,
    });
  }

  @RequirePermission('appointments:read')
  @Get(':appointmentId')
  get(
    @CurrentTeam() teamId: TeamId,
    @Param('appointmentId') appointmentId: string,
  ): Promise<AppointmentView> {
    return this.getAppointment.execute(teamId, appointmentId);
  }

  @RequirePermission('appointments:manage')
  @Post()
  schedule(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ScheduleAppointmentDto,
  ): Promise<AppointmentView> {
    const { requestedBy, ...input } = dto;
    return this.scheduleAppointment.execute({
      ...input,
      teamId,
      actor: toActor(user.userId, requestedBy),
    });
  }

  @RequirePermission('appointments:manage')
  @Post(':appointmentId/confirm')
  @HttpCode(200)
  confirm(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: ChangeAppointmentDto,
  ): Promise<AppointmentView> {
    return this.confirmAppointment.execute({
      teamId,
      appointmentId,
      expectedVersion: dto.version,
      actor: toActor(user.userId, dto.requestedBy),
    });
  }

  @RequirePermission('appointments:manage')
  @Post(':appointmentId/cancel')
  @HttpCode(200)
  cancel(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: CancelAppointmentDto,
  ): Promise<AppointmentView> {
    return this.cancelAppointment.execute({
      teamId,
      appointmentId,
      expectedVersion: dto.version,
      reason: dto.reason,
      actor: toActor(user.userId, dto.requestedBy),
    });
  }

  @RequirePermission('appointments:manage')
  @Post(':appointmentId/reschedule')
  @HttpCode(200)
  reschedule(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: RescheduleAppointmentDto,
  ): Promise<AppointmentView> {
    return this.rescheduleAppointment.execute({
      teamId,
      appointmentId,
      expectedVersion: dto.version,
      agendaId: dto.agendaId,
      time: dto.time,
      actor: toActor(user.userId, dto.requestedBy),
    });
  }
}
