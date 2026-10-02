import { Entity, TeamId } from '../../../../shared/domain/index.js';
import { SERVICE_NAME_MAX_LENGTH } from '../constants/scheduling.constants.js';
import { requiredText } from '../utils/text.js';
import { SchedulingId } from './scheduling-id.vo.js';
import { ServiceCode } from './service-code.vo.js';

export interface MedicalServiceProps {
  teamId: TeamId;
  code: ServiceCode;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A service the IPS offers in outpatient care (Medicina general,
 * Rehabilitación…). Its code is the prefix of its turns. Never deleted,
 * only deactivated, so past appointments keep pointing to it.
 */
export class MedicalService extends Entity<SchedulingId> {
  private constructor(
    id: SchedulingId,
    private props: MedicalServiceProps,
  ) {
    super(id);
  }

  static create(input: { teamId: TeamId; code: string; name: string; now: Date }): MedicalService {
    return new MedicalService(SchedulingId.generate(), {
      teamId: input.teamId,
      code: ServiceCode.of(input.code),
      name: requiredText(input.name, 'name', SERVICE_NAME_MAX_LENGTH, 2),
      active: true,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  static restore(id: SchedulingId, props: MedicalServiceProps): MedicalService {
    return new MedicalService(id, { ...props });
  }

  /** Returns the fields that actually changed (the code is fixed). */
  update(changes: { name?: string; active?: boolean }, now: Date): string[] {
    const changed: string[] = [];
    if (changes.name !== undefined) {
      const name = requiredText(changes.name, 'name', SERVICE_NAME_MAX_LENGTH, 2);
      if (name !== this.props.name) {
        this.props.name = name;
        changed.push('name');
      }
    }
    if (changes.active !== undefined && changes.active !== this.props.active) {
      this.props.active = changes.active;
      changed.push('active');
    }
    if (changed.length > 0) this.props.updatedAt = now;
    return changed;
  }

  get teamId(): TeamId {
    return this.props.teamId;
  }
  get code(): ServiceCode {
    return this.props.code;
  }
  get name(): string {
    return this.props.name;
  }
  get active(): boolean {
    return this.props.active;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
