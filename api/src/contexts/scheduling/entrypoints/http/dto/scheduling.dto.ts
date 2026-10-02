import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * HTTP shape validation only (types, presence). Business rules such as
 * the code format or "the block splits into whole slots" live in the domain.
 */

class RequestedByDto {
  /** Staff member who asked for the change; by default, the caller. */
  @IsOptional()
  @IsString()
  requestedBy?: string;
}

export class CreateServiceDto extends RequestedByDto {
  @IsString()
  code: string;

  @IsString()
  name: string;
}

export class UpdateServiceDto extends RequestedByDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateLocationDto extends RequestedByDto {
  @IsString()
  kind: string;

  @IsString()
  number: string;
}

export class UpdateLocationDto extends RequestedByDto {
  @IsBoolean()
  active: boolean;
}

export class OpenAgendaDto extends RequestedByDto {
  @IsString()
  professionalId: string;

  @IsString()
  serviceId: string;

  @IsString()
  locationId: string;

  @IsString()
  date: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsInt()
  slotMinutes: number;
}

export class ScheduleAppointmentDto extends RequestedByDto {
  @IsString()
  patientId: string;

  @IsString()
  agendaId: string;

  @IsString()
  time: string;
}

export class ChangeAppointmentDto extends RequestedByDto {
  @IsInt()
  @Min(1)
  version: number;
}

export class CancelAppointmentDto extends ChangeAppointmentDto {
  @IsString()
  reason: string;
}

export class RescheduleAppointmentDto extends ChangeAppointmentDto {
  @IsString()
  agendaId: string;

  @IsString()
  time: string;
}

export class DayAgendaQueryDto {
  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  professionalId?: string;

  @IsOptional()
  @IsString()
  serviceId?: string;
}

export class SearchAppointmentsQueryDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  professionalId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
