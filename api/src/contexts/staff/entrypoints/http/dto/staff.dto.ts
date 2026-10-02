import { IsArray, IsString } from 'class-validator';

/** The complete set of roles (replaces the current one; [] removes all). */
export class AssignStaffRolesDto {
  @IsArray()
  @IsString({ each: true })
  roles: string[];
}
