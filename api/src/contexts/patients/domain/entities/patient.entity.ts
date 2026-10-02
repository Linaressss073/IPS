import {
  Entity,
  TeamId,
  ValueObject,
} from '../../../../shared/domain/index.js';
import { MAX_AGE_YEARS } from '../constants/patient.constants.js';
import { BirthDateOutOfRangeError } from '../errors/patient.errors.js';
import {
  FieldChange,
  PatientData,
  PatientProps,
} from '../types/patient.types.js';
import { Affiliation } from './affiliation.vo.js';
import { BiologicalSex } from './biological-sex.vo.js';
import { BirthDate } from './birth-date.vo.js';
import { ContactInfo } from './contact-info.vo.js';
import { IdentityDocument } from './identity-document.vo.js';
import { PatientId } from './patient-id.vo.js';
import { PersonName } from './person-name.vo.js';

const FIELDS: readonly (keyof PatientData)[] = [
  'document',
  'name',
  'birthDate',
  'sex',
  'contact',
  'affiliation',
];

/**
 * Aggregate root of the Patients context: one person cared for by a team
 * (IPS), registered once so no other area has to ask for their data again.
 * Patients are never deleted: their history must stay traceable.
 */
export class Patient extends Entity<PatientId> {
  private constructor(
    id: PatientId,
    private props: PatientProps,
  ) {
    super(id);
  }

  static register(
    input: PatientData & { teamId: TeamId; now: Date },
  ): Patient {
    const { teamId, now, ...data } = input;
    ensurePlausibleBirthDate(data.birthDate, now);
    return new Patient(PatientId.generate(), {
      ...data,
      teamId,
      version: 1,
      registeredAt: now,
      updatedAt: now,
    });
  }

  /** Rebuilds an existing patient from persistence; no rules are re-run. */
  static restore(id: PatientId, props: PatientProps): Patient {
    return new Patient(id, { ...props });
  }

  /**
   * Applies the given fields and returns what actually changed. Fields equal
   * to the current value are ignored; any real change bumps the version.
   * Uniqueness of a new document within the team is checked by the caller.
   */
  update(changes: Partial<PatientData>, now: Date): FieldChange[] {
    if (changes.birthDate) ensurePlausibleBirthDate(changes.birthDate, now);

    const applied = FIELDS.flatMap((field) =>
      this.apply(field, changes[field]),
    );

    if (applied.length > 0) {
      this.props.version += 1;
      this.props.updatedAt = now;
    }
    return applied;
  }

  private apply<K extends keyof PatientData>(
    field: K,
    next: PatientData[K] | undefined,
  ): FieldChange[] {
    const current: ValueObject<unknown> = this.props[field];
    if (!next || current.equals(next)) return [];
    (this.props as PatientData)[field] = next;
    return [{ field, from: current.value, to: next.value }];
  }

  /** Plain copy of the patient data, e.g. for the "registered" trace event. */
  snapshot(): Record<keyof PatientData, unknown> {
    return {
      document: this.document.value,
      name: this.name.value,
      birthDate: this.birthDate.value,
      sex: this.sex.value,
      contact: this.contact.value,
      affiliation: this.affiliation.value,
    };
  }

  get teamId(): TeamId {
    return this.props.teamId;
  }

  get document(): IdentityDocument {
    return this.props.document;
  }

  get name(): PersonName {
    return this.props.name;
  }

  get birthDate(): BirthDate {
    return this.props.birthDate;
  }

  get sex(): BiologicalSex {
    return this.props.sex;
  }

  get contact(): ContactInfo {
    return this.props.contact;
  }

  get affiliation(): Affiliation {
    return this.props.affiliation;
  }

  get version(): number {
    return this.props.version;
  }

  get registeredAt(): Date {
    return this.props.registeredAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}

function ensurePlausibleBirthDate(birthDate: BirthDate, now: Date): void {
  if (birthDate.isAfter(now) || birthDate.ageAt(now) > MAX_AGE_YEARS) {
    throw new BirthDateOutOfRangeError(birthDate.value);
  }
}
