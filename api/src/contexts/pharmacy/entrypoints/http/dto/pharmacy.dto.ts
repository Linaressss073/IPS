import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

// HTTP shape only; quantities and the rest are checked by the domain.

export class DeliveryLineDto {
  @IsInt()
  @Min(0)
  index: number;

  @IsInt()
  quantity: number;
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
