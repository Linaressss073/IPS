import { Body, Controller, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { ActorInput } from '../../../../../shared/application/index.js';
import { TeamId, UserId } from '../../../../../shared/domain/index.js';
import { AuthenticatedUser } from '../../../../identity-access/domain/entities/authenticated-user.entity.js';
import {
  CurrentTeam,
  CurrentUser,
} from '../../../../identity-access/entrypoints/http/decorators/auth.decorators.js';
import { Permission } from '../../../../staff/domain/constants/permissions.js';
import {
  CurrentPermissions,
  RequirePermission,
} from '../../../../staff/entrypoints/http/guards/permission.guard.js';
import {
  AttendTurn,
  CallTurn,
  CheckIn,
  MarkNoShow,
  UpdateCallSettings,
} from '../../../application/commands/admission.commands.js';
import {
  GetBoard,
  GetCallSettings,
  ListTurns,
} from '../../../application/queries/admission.queries.js';
import { BoardView, CallSettingsView, TurnView } from '../../../application/types/admission.types.js';
import {
  CallSettingsDto,
  CheckInDto,
  ListTurnsQueryDto,
  TurnChangeDto,
} from '../dto/admission.dto.js';

const actor = (user: AuthenticatedUser, requestedBy?: string): ActorInput => ({
  executedBy: user.userId,
  requestedBy: requestedBy ? UserId.of(requestedBy) : user.userId,
});

/**
 * Pharmacy staff (holding none of the `unrestricted` permissions) only see and act on pharmacy turns.
 * The lists differ per route on purpose: admission may list and close as no-show, but only `turns:call` calls.
 */
const originScope = (permissions: readonly string[], unrestricted: Permission[]): 'farmacia' | undefined =>
  unrestricted.some((permission) => permissions.includes(permission)) ? undefined : 'farmacia';

/** Admission: check-in, turns, the waiting-room board and call settings. */
@Controller('teams/:teamId')
export class AdmissionController {
  constructor(
    private readonly checkIn: CheckIn,
    private readonly callTurn: CallTurn,
    private readonly attendTurn: AttendTurn,
    private readonly markNoShow: MarkNoShow,
    private readonly listTurns: ListTurns,
    private readonly getBoard: GetBoard,
    private readonly getCallSettings: GetCallSettings,
    private readonly updateCallSettings: UpdateCallSettings,
  ) {}

  /** The patient arrived: they get the next turn of the service. */
  @RequirePermission('admission:manage')
  @Post('turns')
  arrive(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CheckInDto,
  ): Promise<TurnView> {
    return this.checkIn.execute({
      teamId,
      appointmentId: dto.appointmentId,
      actor: actor(user, dto.requestedBy),
    });
  }

  @RequirePermission('turns:call', 'admission:manage', 'pharmacy:dispense')
  @Get('turns')
  list(
    @CurrentTeam() teamId: TeamId,
    @CurrentPermissions() permissions: readonly string[],
    @Query() query: ListTurnsQueryDto,
  ): Promise<TurnView[]> {
    return this.listTurns.execute({
      teamId,
      date: query.date,
      status: query.status,
      professionalId: query.professionalId,
      onlyOrigin: originScope(permissions, ['turns:call', 'admission:manage']),
    });
  }

  @RequirePermission('turns:call', 'pharmacy:dispense')
  @Post('turns/:turnId/call')
  @HttpCode(200)
  call(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentPermissions() permissions: readonly string[],
    @Param('turnId') turnId: string,
    @Body() dto: TurnChangeDto,
  ): Promise<TurnView> {
    const onlyOrigin = originScope(permissions, ['turns:call']);
    return this.callTurn.execute({ teamId, turnId, expectedVersion: dto.version, actor: actor(user, dto.requestedBy), onlyOrigin });
  }

  @RequirePermission('turns:call', 'pharmacy:dispense')
  @Post('turns/:turnId/attend')
  @HttpCode(200)
  attend(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentPermissions() permissions: readonly string[],
    @Param('turnId') turnId: string,
    @Body() dto: TurnChangeDto,
  ): Promise<TurnView> {
    const onlyOrigin = originScope(permissions, ['turns:call']);
    return this.attendTurn.execute({ teamId, turnId, expectedVersion: dto.version, actor: actor(user, dto.requestedBy), onlyOrigin });
  }

  @RequirePermission('turns:call', 'admission:manage', 'pharmacy:dispense')
  @Post('turns/:turnId/no-show')
  @HttpCode(200)
  noShow(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentPermissions() permissions: readonly string[],
    @Param('turnId') turnId: string,
    @Body() dto: TurnChangeDto,
  ): Promise<TurnView> {
    const onlyOrigin = originScope(permissions, ['turns:call', 'admission:manage']);
    return this.markNoShow.execute({ teamId, turnId, expectedVersion: dto.version, actor: actor(user, dto.requestedBy), onlyOrigin });
  }

  /** The waiting-room screen: administrators and the `tv` role. */
  @RequirePermission('room:view')
  @Get('turns/board')
  board(@CurrentTeam() teamId: TeamId): Promise<BoardView> {
    return this.getBoard.execute(teamId);
  }

  @RequirePermission('admission:manage', 'settings:manage')
  @Get('admission/settings')
  settings(@CurrentTeam() teamId: TeamId): Promise<CallSettingsView> {
    return this.getCallSettings.execute(teamId);
  }

  @RequirePermission('settings:manage')
  @Put('admission/settings')
  changeSettings(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CallSettingsDto,
  ): Promise<CallSettingsView> {
    return this.updateCallSettings.execute({
      teamId,
      announceIntervalSeconds: dto.announceIntervalSeconds,
      maxCalls: dto.maxCalls,
      actor: actor(user, dto.requestedBy),
    });
  }
}
