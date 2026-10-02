import { TeamId, UserId } from '../../../../../shared/domain/index.js';
import {
  ActorInput,
  RecordCompanionCommand,
  RegisterPatientCommand,
  UpdatePatientCommand,
} from '../../../application/types/patient.types.js';
import {
  RecordCompanionDto,
  RegisterPatientDto,
  UpdatePatientDto,
} from '../dto/patient.dto.js';

/** HTTP DTOs -> application commands. */
export const PatientCommandMapper = {
  toRegister(
    teamId: TeamId,
    executedBy: UserId,
    dto: RegisterPatientDto,
  ): RegisterPatientCommand {
    const { requestedBy, ...input } = dto;
    return { ...input, teamId, actor: toActor(executedBy, requestedBy) };
  },

  toRecordCompanion(
    teamId: TeamId,
    patientId: string,
    executedBy: UserId,
    dto: RecordCompanionDto,
  ): RecordCompanionCommand {
    const { requestedBy, ...companion } = dto;
    return {
      teamId,
      patientId,
      companion,
      actor: toActor(executedBy, requestedBy),
    };
  },

  toUpdate(
    teamId: TeamId,
    patientId: string,
    executedBy: UserId,
    dto: UpdatePatientDto,
  ): UpdatePatientCommand {
    const { version, requestedBy, ...changes } = dto;
    return {
      teamId,
      patientId,
      expectedVersion: version,
      changes,
      actor: toActor(executedBy, requestedBy),
    };
  },
};

function toActor(executedBy: UserId, requestedBy?: string): ActorInput {
  return {
    executedBy,
    requestedBy: requestedBy ? UserId.of(requestedBy) : undefined,
  };
}
