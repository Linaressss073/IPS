import { Actor, Clock, newTraceEvent } from '../../../../shared/application/index.js';
import { TeamId, UserId } from '../../../../shared/domain/index.js';
import { StaffRoles } from '../../domain/entities/staff-roles.vo.js';
import { StaffMemberNotFoundError } from '../errors/staff.errors.js';
import { StaffProjection } from '../ports/staff-projection.port.js';
import { StaffReadModel } from '../ports/staff-read-model.port.js';
import { StaffRepository } from '../ports/staff.repository.port.js';
import { TeamMembers } from '../ports/team-members.port.js';
import { StaffMemberView } from '../types/staff.types.js';

export const STAFF_ROLES_ASSIGNED = 'staff.roles_assigned';

/**
 * Sets the functional roles of a member of the IPS (administrators only).
 * The change is traced (who, to whom, from what to what) in the same
 * transaction, so permission changes are auditable.
 */
export class AssignStaffRoles {
  constructor(
    private readonly staff: StaffRepository,
    private readonly readModel: StaffReadModel,
    private readonly members: TeamMembers,
    private readonly projection: StaffProjection,
    private readonly clock: Clock,
  ) {}

  async execute(command: {
    teamId: TeamId;
    userId: string;
    roles: readonly string[];
    actor: Actor;
  }): Promise<StaffMemberView> {
    const roles = StaffRoles.of(command.roles);

    const providerRole = await this.members.roleIn(UserId.of(command.userId), command.teamId);
    if (!providerRole) throw new StaffMemberNotFoundError(command.teamId, command.userId);
    await this.staff.ensureMembership(command.teamId, command.userId, `org:${providerRole}`);

    const before = (await this.readModel.rolesOf(command.teamId, command.userId)) ?? [];
    if (!sameRoles(before, roles.value)) {
      await this.staff.setRoles(command.teamId, command.userId, roles.value, [
        newTraceEvent({
          teamId: command.teamId,
          patientId: null,
          type: STAFF_ROLES_ASSIGNED,
          actor: command.actor,
          occurredAt: this.clock.now(),
          data: { userId: command.userId, from: before, to: roles.value },
        }),
      ]);
      await this.projection.refresh([command.userId]);
    }

    const member = await this.readModel.member(command.teamId, command.userId);
    if (!member) throw new StaffMemberNotFoundError(command.teamId, command.userId);
    return member;
  }
}

function sameRoles(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((role) => b.includes(role));
}
