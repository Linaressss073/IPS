import { Actor } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import { RequesterNotATeamMemberError } from '../errors/patient.errors.js';
import { TeamMembers } from '../ports/team-members.port.js';
import { ActorInput } from '../types/patient.types.js';

/**
 * Turns the command's actor into the one recorded in the trace: the
 * requester defaults to the executor, and must belong to the same team.
 */
export class ActorResolver {
  constructor(private readonly members: TeamMembers) {}

  async resolve(teamId: TeamId, input: ActorInput): Promise<Actor> {
    const requestedBy = input.requestedBy ?? input.executedBy;
    if (
      !requestedBy.equals(input.executedBy) &&
      !(await this.members.isMember(requestedBy, teamId))
    ) {
      throw new RequesterNotATeamMemberError(requestedBy);
    }
    return { requestedBy, executedBy: input.executedBy };
  }
}
