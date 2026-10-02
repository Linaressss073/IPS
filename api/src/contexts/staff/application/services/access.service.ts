import { TeamId } from '../../../../shared/domain/index.js';
import { STAFF_ROLES } from '../../domain/constants/staff.constants.js';
import { Permission, permissionsFor } from '../../domain/constants/permissions.js';
import { StaffRole } from '../../domain/types/staff.types.js';
import { StaffReadModel } from '../ports/staff-read-model.port.js';
import { MyAccessView } from '../types/staff.types.js';

/**
 * What a member may do in an IPS: administrators (from the identity
 * provider) plus the functional roles stored in the staff directory.
 */
export class AccessService {
  constructor(private readonly readModel: StaffReadModel) {}

  async accessOf(input: {
    teamId: TeamId;
    userId: string;
    isAdmin: boolean;
  }): Promise<MyAccessView> {
    const stored = (await this.readModel.rolesOf(input.teamId, input.userId)) ?? [];
    const roles = stored.filter((role): role is StaffRole =>
      STAFF_ROLES.includes(role as StaffRole),
    );
    return {
      userId: input.userId,
      isAdmin: input.isAdmin,
      roles,
      permissions: permissionsFor({ isAdmin: input.isAdmin, roles }),
    };
  }

  async allows(
    input: { teamId: TeamId; userId: string; isAdmin: boolean },
    permission: Permission,
  ): Promise<boolean> {
    return (await this.accessOf(input)).permissions.includes(permission);
  }
}
