import { Body, Controller, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { ActorInput } from '../../../../../shared/application/index.js';
import { TeamId, UserId } from '../../../../../shared/domain/index.js';
import { TEAM_ADMIN_ROLE } from '../../../../identity-access/domain/constants/roles.js';
import { AuthenticatedUser } from '../../../../identity-access/domain/entities/authenticated-user.entity.js';
import {
  CurrentTeam,
  CurrentTeamRole,
  CurrentUser,
} from '../../../../identity-access/entrypoints/http/decorators/auth.decorators.js';
import { AccessService } from '../../../../staff/application/services/access.service.js';
import { Permission } from '../../../../staff/domain/constants/permissions.js';
import { RequirePermission } from '../../../../staff/entrypoints/http/guards/permission.guard.js';
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
    private readonly access: AccessService,
  ) {}

  /** Pharmacy staff (no `unrestricted` permission) only see and act on pharmacy turns. */
  private async originScope(
    teamId: TeamId,
    user: AuthenticatedUser,
    teamRole: string,
    unrestricted: Permission[],
  ): Promise<'farmacia' | undefined> {
    const { permissions } = await this.access.accessOf({
      teamId,
      userId: user.userId.value,
      isAdmin: teamRole === TEAM_ADMIN_ROLE,
    });
    return unrestricted.some((permission) => permissions.includes(permission)) ? undefined : 'farmacia';
  }

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
  async list(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTeamRole() teamRole: string,
    @Query() query: ListTurnsQueryDto,
  ): Promise<TurnView[]> {
    return this.listTurns.execute({
      teamId,
      date: query.date,
      status: query.status,
      professionalId: query.professionalId,
      onlyOrigin: await this.originScope(teamId, user, teamRole, ['turns:call', 'admission:manage']),
    });
  }

  @RequirePermission('turns:call', 'pharmacy:dispense')
  @Post('turns/:turnId/call')
  @HttpCode(200)
  async call(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTeamRole() teamRole: string,
    @Param('turnId') turnId: string,
    @Body() dto: TurnChangeDto,
  ): Promise<TurnView> {
    const onlyOrigin = await this.originScope(teamId, user, teamRole, ['turns:call']);
    return this.callTurn.execute({ teamId, turnId, expectedVersion: dto.version, actor: actor(user, dto.requestedBy), onlyOrigin });
  }

  @RequirePermission('turns:call', 'pharmacy:dispense')
  @Post('turns/:turnId/attend')
  @HttpCode(200)
  async attend(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTeamRole() teamRole: string,
    @Param('turnId') turnId: string,
    @Body() dto: TurnChangeDto,
  ): Promise<TurnView> {
    const onlyOrigin = await this.originScope(teamId, user, teamRole, ['turns:call']);
    return this.attendTurn.execute({ teamId, turnId, expectedVersion: dto.version, actor: actor(user, dto.requestedBy), onlyOrigin });
  }

  @RequirePermission('turns:call', 'admission:manage', 'pharmacy:dispense')
  @Post('turns/:turnId/no-show')
  @HttpCode(200)
  async noShow(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTeamRole() teamRole: string,
    @Param('turnId') turnId: string,
    @Body() dto: TurnChangeDto,
  ): Promise<TurnView> {
    const onlyOrigin = await this.originScope(teamId, user, teamRole, ['turns:call', 'admission:manage']);
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
