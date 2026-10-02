import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * HTTP shape only. Fields left out keep their value; `null` clears an
 * optional field. Business rules (NIT check digit, REPS code…) are in the
 * domain.
 */
export class UpdateOrganizationDto {
  /** The version the client read (optimistic locking). */
  @IsInt()
  @Min(1)
  version: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nit?: string | null;

  @IsOptional()
  @IsString()
  habilitationCode?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  city?: string | null;

  @IsOptional()
  @IsString()
  department?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsString()
  email?: string | null;
}
