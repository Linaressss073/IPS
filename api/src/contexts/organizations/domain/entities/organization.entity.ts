import { Entity, TeamId } from '../../../../shared/domain/index.js';
import { OrganizationDeletedError } from '../errors/organization.errors.js';
import {
  OrganizationFieldChange,
  OrganizationProfileProps,
  OrganizationProps,
  OrganizationStatus,
} from '../types/organization.types.js';
import { OrganizationName } from './organization-name.vo.js';
import {
  OrganizationProfile,
  OrganizationProfileInput,
} from './organization-profile.vo.js';

/**
 * Aggregate root of the Organizations context: an IPS. Its identity and name
 * come from the identity provider (a Clerk organization); its business data
 * (NIT, REPS code, address…) lives only here. Deleting it leaves a tombstone:
 * the IPS's clinical records are kept, as the law requires.
 */
export class Organization extends Entity<TeamId> {
  private constructor(
    id: TeamId,
    private props: OrganizationProps,
  ) {
    super(id);
  }

  /** First time we see an organization of the provider. */
  static importFromProvider(input: {
    id: TeamId;
    name: OrganizationName;
    providerUpdatedAt: Date;
    now: Date;
  }): Organization {
    return new Organization(input.id, {
      name: input.name,
      profile: OrganizationProfile.empty(),
      status: 'active',
      providerUpdatedAt: input.providerUpdatedAt,
      createdAt: input.now,
      updatedAt: input.now,
      version: 1,
      deletedAt: null,
      deletedBy: null,
    });
  }

  /** Rebuilds an existing organization from persistence; no rules are re-run. */
  static restore(id: TeamId, props: OrganizationProps): Organization {
    return new Organization(id, { ...props });
  }

  /**
   * Applies a change made in the provider. Returns false (and changes
   * nothing) if it is older than what we have or the IPS was deleted.
   */
  syncFromProvider(
    name: OrganizationName,
    providerUpdatedAt: Date,
    now: Date,
  ): boolean {
    if (this.isDeleted || providerUpdatedAt <= this.props.providerUpdatedAt) {
      return false;
    }
    this.props.providerUpdatedAt = providerUpdatedAt;
    if (name.equals(this.props.name)) return false;
    this.props.name = name;
    this.touch(now);
    return true;
  }

  /** Name and/or profile fields; returns what actually changed. */
  update(
    changes: { name?: OrganizationName; profile?: OrganizationProfileInput },
    now: Date,
  ): OrganizationFieldChange[] {
    this.ensureActive();
    const applied: OrganizationFieldChange[] = [];

    if (changes.name && !changes.name.equals(this.props.name)) {
      applied.push({ field: 'name', from: this.props.name.value, to: changes.name.value });
      this.props.name = changes.name;
    }
    if (changes.profile) {
      const before = this.props.profile.value;
      const after = this.props.profile.with(changes.profile);
      for (const field of Object.keys(before) as (keyof OrganizationProfileProps)[]) {
        if (before[field] !== after.value[field]) {
          applied.push({ field, from: before[field], to: after.value[field] });
        }
      }
      this.props.profile = after;
    }

    if (applied.length > 0) this.touch(now);
    return applied;
  }

  /** Deleted from the app by an administrator. */
  delete(deletedBy: string, now: Date): void {
    this.ensureActive();
    this.markDeleted(deletedBy, now);
  }

  /** The provider reports it deleted; idempotent. */
  deleteFromProvider(now: Date): boolean {
    if (this.isDeleted) return false;
    this.markDeleted(null, now);
    return true;
  }

  get name(): OrganizationName {
    return this.props.name;
  }

  get profile(): OrganizationProfile {
    return this.props.profile;
  }

  get status(): OrganizationStatus {
    return this.props.status;
  }

  get isDeleted(): boolean {
    return this.props.status === 'deleted';
  }

  get providerUpdatedAt(): Date {
    return this.props.providerUpdatedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get version(): number {
    return this.props.version;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  get deletedBy(): string | null {
    return this.props.deletedBy;
  }

  private markDeleted(deletedBy: string | null, now: Date): void {
    this.props.status = 'deleted';
    this.props.deletedAt = now;
    this.props.deletedBy = deletedBy;
    this.touch(now);
  }

  private touch(now: Date): void {
    this.props.updatedAt = now;
    this.props.version += 1;
  }

  private ensureActive(): void {
    if (this.isDeleted) throw new OrganizationDeletedError(this.id);
  }
}
