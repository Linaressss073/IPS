import { Controller, Get, Query } from '@nestjs/common';
import { TeamId } from '../../../../../shared/domain/index.js';
import { CurrentTeam } from '../../../../identity-access/entrypoints/http/decorators/auth.decorators.js';
import { RequirePermission } from '../../../../staff/entrypoints/http/guards/permission.guard.js';
import { ClinicalAccessAudit } from '../../../application/queries/clinical-access.audit.js';
import { ClinicalAccessView } from '../../../application/types/consultation.types.js';
import { ClinicalAccessQueryDto } from '../dto/consultation.dto.js';

/** Who opened a patient's clinical data. Administrators see who and when, never the content. */
@Controller('teams/:teamId/clinical-access')
export class ClinicalAccessController {
  constructor(private readonly audit: ClinicalAccessAudit) {}

  @RequirePermission('audit:read')
  @Get()
  list(@CurrentTeam() teamId: TeamId, @Query() query: ClinicalAccessQueryDto): Promise<ClinicalAccessView[]> {
    return this.audit.list(teamId, query.patientId);
  }
}
