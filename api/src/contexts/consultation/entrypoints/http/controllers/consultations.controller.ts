import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ActorInput } from '../../../../../shared/application/index.js';
import { InvalidValueError, TeamId } from '../../../../../shared/domain/index.js';
import { AuthenticatedUser } from '../../../../identity-access/domain/entities/authenticated-user.entity.js';
import {
  CurrentTeam,
  CurrentUser,
} from '../../../../identity-access/entrypoints/http/decorators/auth.decorators.js';
import { RequirePermission } from '../../../../staff/entrypoints/http/guards/permission.guard.js';
import {
  AddAddendum,
  SignConsultation,
  StartConsultation,
  UpdateConsultation,
} from '../../../application/commands/consultation.commands.js';
import { ConsultationQueries } from '../../../application/queries/consultation.queries.js';
import { ConsultationView } from '../../../application/types/consultation.types.js';
import {
  DiagnosisProps,
  PrescriptionItemProps,
  VitalSignProps,
} from '../../../domain/types/consultation.types.js';
import {
  AddendumDto,
  ListConsultationsQueryDto,
  StartConsultationDto,
  UpdateConsultationDto,
  VersionDto,
} from '../dto/consultation.dto.js';

/** The physician acts in person: no "requested by" someone else here. */
const actor = (user: AuthenticatedUser): ActorInput => ({ executedBy: user.userId });

/** The clinical record. Physicians only (clinical:read / clinical:write). */
@Controller('teams/:teamId/consultations')
export class ConsultationsController {
  constructor(
    private readonly queries: ConsultationQueries,
    private readonly startConsultation: StartConsultation,
    private readonly updateConsultation: UpdateConsultation,
    private readonly signConsultation: SignConsultation,
    private readonly addAddendum: AddAddendum,
  ) {}

  @RequirePermission('clinical:read')
  @Get()
  list(@CurrentTeam() teamId: TeamId, @Query() query: ListConsultationsQueryDto): Promise<ConsultationView[]> {
    if (!query.patientId && !query.appointmentId) {
      throw new InvalidValueError('Filter by patientId or appointmentId');
    }
    return this.queries.list(teamId, { patientId: query.patientId, appointmentId: query.appointmentId });
  }

  @RequirePermission('clinical:read')
  @Get(':consultationId')
  get(@CurrentTeam() teamId: TeamId, @Param('consultationId') id: string): Promise<ConsultationView> {
    return this.queries.get(teamId, id);
  }

  /** Opens the consultation of the appointment (or returns the one already open). */
  @RequirePermission('clinical:write')
  @Post()
  @HttpCode(200)
  start(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StartConsultationDto,
  ): Promise<ConsultationView> {
    return this.startConsultation.execute({ teamId, appointmentId: dto.appointmentId, actor: actor(user) });
  }

  @RequirePermission('clinical:write')
  @Patch(':consultationId')
  update(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Param('consultationId') consultationId: string,
    @Body() dto: UpdateConsultationDto,
  ): Promise<ConsultationView> {
    return this.updateConsultation.execute({
      teamId,
      consultationId,
      expectedVersion: dto.version,
      note: dto.note && {
        reason: dto.note.reason,
        currentIllness: dto.note.currentIllness,
        physicalExam: dto.note.physicalExam,
        plan: dto.note.plan,
      },
      vitals: dto.vitals?.map((v) => ({ name: v.name, value: v.value }) as VitalSignProps),
      diagnoses: dto.diagnoses?.map((d): DiagnosisProps => ({ code: d.code, description: d.description, principal: d.principal })),
      prescription: dto.prescription?.map(
        (item) =>
          ({
            medication: item.medication,
            presentation: item.presentation,
            dose: item.dose,
            route: item.route,
            frequency: item.frequency,
            durationDays: item.durationDays,
            quantity: item.quantity,
            instructions: item.instructions,
          }) as PrescriptionItemProps,
      ),
      actor: actor(user),
    });
  }

  @RequirePermission('clinical:write')
  @Post(':consultationId/sign')
  @HttpCode(200)
  sign(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Param('consultationId') consultationId: string,
    @Body() dto: VersionDto,
  ): Promise<ConsultationView> {
    return this.signConsultation.execute({ teamId, consultationId, expectedVersion: dto.version, actor: actor(user) });
  }

  @RequirePermission('clinical:write')
  @Post(':consultationId/addenda')
  @HttpCode(200)
  addendum(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Param('consultationId') consultationId: string,
    @Body() dto: AddendumDto,
  ): Promise<ConsultationView> {
    return this.addAddendum.execute({
      teamId,
      consultationId,
      expectedVersion: dto.version,
      text: dto.text,
      actor: actor(user),
    });
  }
}
