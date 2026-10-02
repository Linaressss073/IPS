import type { Request } from 'express';
import { TeamId } from '../../../../../shared/domain/index.js';
import { AuthenticatedUser } from '../../../domain/entities/authenticated-user.entity.js';

export interface AuthenticatedRequest extends Request {
  auth?: AuthenticatedUser;
  teamId?: TeamId;
}
