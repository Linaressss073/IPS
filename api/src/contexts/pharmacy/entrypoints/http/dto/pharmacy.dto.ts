import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

// HTTP shape only; quantities and the rest are checked by the domain.

export class DeliveryLineDto {
  @IsInt()
  @Min(0)
  index: number;

  @IsInt()
  quantity: number;

  /** Catalog product the units come from. */
  @IsString()
  productId: string;
}

export class DispenseDto {
  @IsInt()
  @Min(0)
  version: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryLineDto)
  lines: DeliveryLineDto[];

  @IsOptional()
  @IsString()
  note?: string;
}

export class PharmacyTurnDto {
  @IsString()
  windowId: string;
}

export class PrescriptionsQueryDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  presentation: string;

  @IsInt()
  minStock: number;
}

export class UpdateProductDto {
  @IsOptional()
  @IsInt()
  minStock?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ReceiveLotDto {
  @IsString()
  lotNumber: string;

  /** YYYY-MM-DD */
  @IsString()
  expiresOn: string;

  @IsInt()
  quantity: number;

  @IsOptional()
  @IsString()
  supplier?: string;
}

export class AdjustLotDto {
  @IsString()
  lotNumber: string;

  /** Signed: negative to write off. */
  @IsInt()
  quantity: number;

  @IsString()
  reason: string;
}
