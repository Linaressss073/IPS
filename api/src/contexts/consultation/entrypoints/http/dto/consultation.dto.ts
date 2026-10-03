import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

/** HTTP shape only; ranges and clinical rules live in the domain. */

export class StartConsultationDto {
  @IsString()
  appointmentId: string;
}

export class NoteDto {
  @IsString()
  reason: string;

  @IsString()
  currentIllness: string;

  @IsString()
  physicalExam: string;

  @IsString()
  plan: string;
}

export class VitalSignDto {
  @IsString()
  name: string;

  @IsNumber()
  value: number;
}

export class DiagnosisDto {
  @IsString()
  code: string;

  @IsString()
  description: string;

  @IsBoolean()
  principal: boolean;
}

export class PrescriptionItemDto {
  @IsString()
  medication: string;

  @IsString()
  presentation: string;

  @IsString()
  dose: string;

  @IsString()
  route: string;

  @IsString()
  frequency: string;

  @IsInt()
  durationDays: number;

  @IsInt()
  quantity: number;

  @IsString()
  instructions: string;
}

export class VersionDto {
  @IsInt()
  @Min(1)
  version: number;
}

export class UpdateConsultationDto extends VersionDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => NoteDto)
  note?: NoteDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VitalSignDto)
  vitals?: VitalSignDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisDto)
  diagnoses?: DiagnosisDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  prescription?: PrescriptionItemDto[];
}

export class AddendumDto extends VersionDto {
  @IsString()
  text: string;
}

export class ListConsultationsQueryDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;
}
