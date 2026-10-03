import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { TeamId } from '../../../../../shared/domain/index.js';
import { AuthenticatedUser } from '../../../../identity-access/domain/entities/authenticated-user.entity.js';
import {
  CurrentTeam,
  CurrentUser,
} from '../../../../identity-access/entrypoints/http/decorators/auth.decorators.js';
import { RequirePermission } from '../../../../staff/entrypoints/http/guards/permission.guard.js';
import {
  Dispense,
  IssuePharmacyTurnForPrescription,
} from '../../../application/commands/pharmacy.commands.js';
import { PharmacyQueries } from '../../../application/queries/pharmacy.queries.js';
import { PharmacyPrescriptionView } from '../../../application/types/pharmacy.types.js';

import { DispenseDto, PharmacyTurnDto, PrescriptionsQueryDto } from '../dto/pharmacy.dto.js';

/** Pharmacy: signed prescriptions, deliveries and the pharmacy's turns. */
@RequirePermission('pharmacy:dispense')
@Controller('teams/:teamId/pharmacy/prescriptions')
export class PharmacyController {
  constructor(
    private readonly queries: PharmacyQueries,
    private readonly dispense: Dispense,
    private readonly issueTurn: IssuePharmacyTurnForPrescription,
  ) {}

  @Get()
  list(@CurrentTeam() teamId: TeamId, @Query() query: PrescriptionsQueryDto): Promise<PharmacyPrescriptionView[]> {
    return this.queries.list(teamId, { date: query.date, patientId: query.patientId, status: query.status });
  }

  @Get(':consultationId')
  get(@CurrentTeam() teamId: TeamId, @Param('consultationId') consultationId: string): Promise<PharmacyPrescriptionView> {
    return this.queries.get(teamId, consultationId);
  }

  @Post(':consultationId/deliveries')
  @HttpCode(200)
  deliver(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Param('consultationId') consultationId: string,
    @Body() dto: DispenseDto,
  ): Promise<PharmacyPrescriptionView> {
    return this.dispense.execute({
      teamId,
      consultationId,
      expectedVersion: dto.version,
      lines: dto.lines.map((line) => ({ index: line.index, quantity: line.quantity, productId: line.productId })),
      note: dto.note ?? '',
      actor: { executedBy: user.userId },
    });
  }

  @Post(':consultationId/turn')
  turn(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Param('consultationId') consultationId: string,
    @Body() dto: PharmacyTurnDto,
  ) {
    return this.issueTurn.execute({ teamId, consultationId, windowId: dto.windowId, actor: { executedBy: user.userId } });
  }
}
