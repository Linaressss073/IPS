import { TeamId, UserId } from '../../domain/index.js';
import { RequesterNotATeamMemberError } from '../errors/actor.errors.js';
import { TeamMembers } from '../ports/team-members.port.js';
import { Actor } from '../types/trace-event.types.js';

/** Who executes a command and, optionally, who asked for it. */
export interface ActorInput {
  executedBy: UserId;
  requestedBy?: UserId;
}

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

