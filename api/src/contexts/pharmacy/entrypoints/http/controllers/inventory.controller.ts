import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TeamId } from '../../../../../shared/domain/index.js';
import { AuthenticatedUser } from '../../../../identity-access/domain/entities/authenticated-user.entity.js';
import {
  CurrentTeam,
  CurrentUser,
} from '../../../../identity-access/entrypoints/http/decorators/auth.decorators.js';
import { RequirePermission } from '../../../../staff/entrypoints/http/guards/permission.guard.js';
import {
  AdjustLot,
  CreateProduct,
  ReceiveLot,
  UpdateProduct,
} from '../../../application/commands/inventory.commands.js';
import { InventoryQueries } from '../../../application/queries/inventory.queries.js';
import { MovementView, ProductView } from '../../../application/types/pharmacy.types.js';
import { AdjustLotDto, CreateProductDto, ReceiveLotDto, UpdateProductDto } from '../dto/pharmacy.dto.js';

/** The pharmacy's catalog, lots (receipts, adjustments) and kardex. */
@RequirePermission('pharmacy:dispense')
@Controller('teams/:teamId/pharmacy/products')
export class InventoryController {
  constructor(
    private readonly queries: InventoryQueries,
    private readonly createProduct: CreateProduct,
    private readonly updateProduct: UpdateProduct,
    private readonly receiveLot: ReceiveLot,
    private readonly adjustLot: AdjustLot,
  ) {}

  @Get()
  list(@CurrentTeam() teamId: TeamId): Promise<ProductView[]> {
    return this.queries.list(teamId);
  }

  @Post()
  create(@CurrentTeam() teamId: TeamId, @Body() dto: CreateProductDto): Promise<ProductView> {
    return this.createProduct.execute({ teamId, name: dto.name, presentation: dto.presentation, minStock: dto.minStock });
  }

  @Get(':productId')
  get(@CurrentTeam() teamId: TeamId, @Param('productId') productId: string): Promise<ProductView> {
    return this.queries.get(teamId, productId);
  }

  @Patch(':productId')
  update(
    @CurrentTeam() teamId: TeamId,
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductView> {
    return this.updateProduct.execute({ teamId, productId, minStock: dto.minStock, active: dto.active });
  }

  @Get(':productId/movements')
  movements(@CurrentTeam() teamId: TeamId, @Param('productId') productId: string): Promise<MovementView[]> {
    return this.queries.movements(teamId, productId);
  }

  @Post(':productId/lots')
  receive(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId') productId: string,
    @Body() dto: ReceiveLotDto,
  ): Promise<ProductView> {
    return this.receiveLot.execute({
      teamId,
      productId,
      lotNumber: dto.lotNumber,
      expiresOn: dto.expiresOn,
      quantity: dto.quantity,
      supplier: dto.supplier ?? '',
      actor: { executedBy: user.userId },
    });
  }

  @Post(':productId/adjustments')
  adjust(
    @CurrentTeam() teamId: TeamId,
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId') productId: string,
    @Body() dto: AdjustLotDto,
  ): Promise<ProductView> {
    return this.adjustLot.execute({
      teamId,
      productId,
      lotNumber: dto.lotNumber,
      quantity: dto.quantity,
      reason: dto.reason,
      actor: { executedBy: user.userId },
    });
  }
}
