import { Entity, InvalidValueError, TeamId } from '../../../../shared/domain/index.js';
import {
  LOCATION_KIND_MAX_LENGTH,
  LOCATION_NUMBER_PATTERN,
} from '../constants/scheduling.constants.js';
import { requiredText } from '../utils/text.js';
import { SchedulingId } from './scheduling-id.vo.js';

export interface CareLocationProps {
  teamId: TeamId;
  kind: string;
  number: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Where patients are attended and called: a kind and a number, shown as
 * "Consultorio 502" or "Vacunación 101". Unique in the IPS; deactivated,
 * never deleted.
 */
export class CareLocation extends Entity<SchedulingId> {
  private constructor(
    id: SchedulingId,
    private props: CareLocationProps,
  ) {
    super(id);
  }

  static create(input: { teamId: TeamId; kind: string; number: string; now: Date }): CareLocation {
    const kind = requiredText(input.kind, 'kind', LOCATION_KIND_MAX_LENGTH, 2);
    const number = (input.number ?? '').trim();
    if (!LOCATION_NUMBER_PATTERN.test(number)) {
      throw new InvalidValueError('number must be 1 to 10 letters, digits or "-"');
    }
    return new CareLocation(SchedulingId.generate(), {
      teamId: input.teamId,
      // "consultorio" -> "Consultorio"
      kind: kind.charAt(0).toUpperCase() + kind.slice(1),
      number,
      active: true,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  static restore(id: SchedulingId, props: CareLocationProps): CareLocation {
    return new CareLocation(id, { ...props });
  }

  /** True if it changed. */
  setActive(active: boolean, now: Date): boolean {
    if (active === this.props.active) return false;
    this.props.active = active;
    this.props.updatedAt = now;
    return true;
  }

  get label(): string {
    return `${this.props.kind} ${this.props.number}`;
  }
  get teamId(): TeamId {
    return this.props.teamId;
  }
  get kind(): string {
    return this.props.kind;
  }
  get number(): string {
    return this.props.number;
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
