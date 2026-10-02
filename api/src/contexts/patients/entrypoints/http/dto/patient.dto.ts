import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * HTTP shape validation only (types, presence). Business rules such as the
 * document format or "particular has no EPS" live in the domain.
 */
export class DocumentDto {
  @IsString()
  type: string;

  @IsString()
  number: string;
}

export class NameDto {
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  middleName?: string | null;

  @IsString()
  firstLastName: string;

  @IsOptional()
  @IsString()
  secondLastName?: string | null;
}

export class ContactDto {
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;
}

export class AffiliationDto {
  @IsOptional()
  @IsString()
  eps?: string | null;

  @IsString()
  regime: string;
}

/** Every field optional; the domain requires at least a name or a phone. */
export class CompanionDto {
  @IsOptional()
  @IsString()
  relationship?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => NameDto)
  name?: NameDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentDto)
  document?: DocumentDto | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsString()
  email?: string | null;
}

export class RecordCompanionDto extends CompanionDto {
  /** User who asked for it; defaults to the caller. */
  @IsOptional()
  @IsString()
  requestedBy?: string;
}

export class RegisterPatientDto {
  @ValidateNested()
  @Type(() => DocumentDto)
  document: DocumentDto;

  @ValidateNested()
  @Type(() => NameDto)
  name: NameDto;

  @IsString()
  birthDate: string;

  @IsString()
  sex: string;

  @ValidateNested()
  @Type(() => ContactDto)
  contact: ContactDto;

  @ValidateNested()
  @Type(() => AffiliationDto)
  affiliation: AffiliationDto;

  /** Optional first companion; recorded as #1. */
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanionDto)
  companion?: CompanionDto | null;

  /** User who asked for the registration; defaults to the caller. */
  @IsOptional()
  @IsString()
  requestedBy?: string;
}

/** Each group sent replaces the current one as a whole. */
export class UpdatePatientDto {
  /** The version the client read (optimistic locking). */
  @IsInt()
  @Min(1)
  version: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentDto)
  document?: DocumentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NameDto)
  name?: NameDto;

  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  sex?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  contact?: ContactDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AffiliationDto)
  affiliation?: AffiliationDto;

  @IsOptional()
  @IsString()
  requestedBy?: string;
}

export class SearchPatientsQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
