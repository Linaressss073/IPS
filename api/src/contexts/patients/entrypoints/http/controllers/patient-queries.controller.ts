import { Controller, Get, Param, Query } from '@nestjs/common';
import { TeamId } from '../../../../../shared/domain/index.js';
import { CurrentTeam } from '../../../../identity-access/entrypoints/http/decorators/auth.decorators.js';
import { RequirePermission } from '../../../../staff/entrypoints/http/guards/permission.guard.js';
import { GetPatientCompanions } from '../../../application/queries/get-patient-companions.query.js';
import { GetPatientTimeline } from '../../../application/queries/get-patient-timeline.query.js';
import { GetPatient } from '../../../application/queries/get-patient.query.js';
import { SearchPatients } from '../../../application/queries/search-patients.query.js';
import {
  CompanionView,
  Page,
  PatientView,
  TimelineEntryView,
} from '../../../application/types/patient.types.js';
import { SearchPatientsQueryDto } from '../dto/patient.dto.js';

/** Read side: every route runs one query against a read model. */
@RequirePermission('patients:read')
@Controller('teams/:teamId/patients')
export class PatientQueriesController {
  constructor(
    private readonly searchPatients: SearchPatients,
    private readonly getPatient: GetPatient,
    private readonly getPatientTimeline: GetPatientTimeline,
    private readonly getPatientCompanions: GetPatientCompanions,
  ) {}

  @Get()
  search(
    @CurrentTeam() teamId: TeamId,
    @Query() query: SearchPatientsQueryDto,
  ): Promise<Page<PatientView>> {
    return this.searchPatients.execute({
      teamId,
      q: query.q,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get(':patientId')
  get(
    @CurrentTeam() teamId: TeamId,
    @Param('patientId') patientId: string,
  ): Promise<PatientView> {
    return this.getPatient.execute({ teamId, patientId });
  }

  @Get(':patientId/timeline')
  timeline(
    @CurrentTeam() teamId: TeamId,
    @Param('patientId') patientId: string,
  ): Promise<TimelineEntryView[]> {
    return this.getPatientTimeline.execute({ teamId, patientId });
  }

  @Get(':patientId/companions')
  companions(
    @CurrentTeam() teamId: TeamId,
    @Param('patientId') patientId: string,
  ): Promise<{ history: CompanionView[] }> {
    return this.getPatientCompanions.execute({ teamId, patientId });
  }
}
