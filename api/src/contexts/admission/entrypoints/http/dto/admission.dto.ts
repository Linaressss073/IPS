import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/** HTTP shape only; the rules live in the domain. */

class RequestedByDto {
  /** Staff member who asked for the change; by default, the caller. */
  @IsOptional()
  @IsString()
  requestedBy?: string;
}

export class CheckInDto extends RequestedByDto {
  @IsString()
  appointmentId: string;
}

export class TurnChangeDto extends RequestedByDto {
  @IsInt()
  @Min(1)
  version: number;
}

export class CallSettingsDto extends RequestedByDto {
  @IsInt()
  announceIntervalSeconds: number;

  @IsInt()
  maxCalls: number;
}

export class ListTurnsQueryDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  professionalId?: string;
}
