import { ActorInput } from '../../../../../shared/application/index.js';
import { UserId } from '../../../../../shared/domain/index.js';

/** The caller executes; `requestedBy` (optional) is who asked for it. */
export function toActor(executedBy: UserId, requestedBy?: string): ActorInput {
  return {
    executedBy,
    requestedBy: requestedBy ? UserId.of(requestedBy) : undefined,
  };
}
