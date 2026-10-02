import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { TeamId } from '../../../../../shared/domain/index.js';
import { AuthenticatedUser } from '../../../../identity-access/domain/entities/authenticated-user.entity.js';
import {
  CurrentTeam,
  CurrentUser,
} from '../../../../identity-access/entrypoints/http/decorators/auth.decorators.js';
import { RequirePermission } from '../../../../staff/entrypoints/http/guards/permission.guard.js';
import { RecordCompanion } from '../../../application/commands/record-companion.command.js';
import { RegisterPatient } from '../../../application/commands/register-patient.command.js';
import { UpdatePatient } from '../../../application/commands/update-patient.command.js';
import {
  CompanionView,
  PatientView,
} from '../../../application/types/patient.types.js';
import {
  RecordCompanionDto,
  RegisterPatientDto,
  UpdatePatientDto,
} from '../dto/patient.dto.js';
import { PatientCommandMapper } from '../mapping/patient-command.mapper.js';

/**
 * Write side: every route runs one command; the caller is the executor.
 * Only roles that register patients (agendamiento, admision, admins).
 */
@RequirePermission('patients:write')
@Controller('teams/:teamId/patients')
export class PatientCommandsController {
  constructor(
    private readonly registerPatient: RegisterPatient,
    private readonly updatePatient: UpdatePatient,
    private readonly recordCompanion: RecordCompanion,
  ) {}

  @Post()
  register(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterPatientDto,
  ): Promise<PatientView> {
    return this.registerPatient.execute(
      PatientCommandMapper.toRegister(teamId, user.userId, dto),
    );
  }

  @Patch(':patientId')
  update(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Param('patientId') patientId: string,
    @Body() dto: UpdatePatientDto,
  ): Promise<PatientView> {
    return this.updatePatient.execute(
      PatientCommandMapper.toUpdate(teamId, patientId, user.userId, dto),
    );
  }

  @Post(':patientId/companions')
  addCompanion(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Param('patientId') patientId: string,
    @Body() dto: RecordCompanionDto,
  ): Promise<CompanionView> {
    return this.recordCompanion.execute(
      PatientCommandMapper.toRecordCompanion(teamId, patientId, user.userId, dto),
    );
  }
}
