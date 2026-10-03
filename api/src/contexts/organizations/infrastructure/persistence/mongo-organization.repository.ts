import { MongoServerError, type Collection, type Db } from 'mongodb';
import { TeamId } from '../../../../shared/domain/index.js';
import {
  OrganizationAlreadyStoredError,
  OrganizationNotFoundError,
  OrganizationVersionConflictError,
} from '../../application/errors/organization.errors.js';
import { OrganizationRepository } from '../../application/ports/organization.repository.port.js';
import { OrganizationName } from '../../domain/entities/organization-name.vo.js';
import { OrganizationProfile } from '../../domain/entities/organization-profile.vo.js';
import { Organization } from '../../domain/entities/organization.entity.js';
import {
  OrganizationProfileProps,
  OrganizationStatus,
} from '../../domain/types/organization.types.js';

export const ORGANIZATIONS_COLLECTION = 'organizations';

const DUPLICATE_KEY = 11000;

/** One document per IPS, keyed by the provider's organization id. */
export interface OrganizationDocument {
  _id: string;
  name: string;
  profile: OrganizationProfileProps;
  status: OrganizationStatus;
  providerUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  deletedAt: Date | null;
  deletedBy: string | null;
}

export class MongoOrganizationRepository implements OrganizationRepository {
  private readonly collection: Collection<OrganizationDocument>;

  constructor(mongo: Db) {
    this.collection = mongo.collection<OrganizationDocument>(ORGANIZATIONS_COLLECTION);
  }

  async exists(id: TeamId): Promise<boolean> {
    return (await this.collection.countDocuments({ _id: id.value }, { limit: 1 })) > 0;
  }

  async getById(id: TeamId): Promise<Organization> {
    const doc = await this.collection.findOne({ _id: id.value });
    if (!doc) throw new OrganizationNotFoundError(id);
    return toDomain(doc);
  }

  async insert(organization: Organization): Promise<void> {
    try {
      await this.collection.insertOne(toDocument(organization));
    } catch (error) {
      if (error instanceof MongoServerError && error.code === DUPLICATE_KEY) {
        throw new OrganizationAlreadyStoredError(organization.id);
      }
      throw error;
    }
  }

  async listActive(): Promise<{ id: TeamId; providerUpdatedAt: Date }[]> {
    const docs = await this.collection
      .find({ status: { $ne: 'deleted' } }, { projection: { providerUpdatedAt: 1 } })
      .toArray();
    return docs.map((doc) => ({ id: TeamId.of(doc._id), providerUpdatedAt: doc.providerUpdatedAt }));
  }

  /** Optimistic locking: the stored document must still be at `expectedVersion`. */
  async save(organization: Organization, expectedVersion: number): Promise<void> {
    const { _id, ...fields } = toDocument(organization);
    const result = await this.collection.replaceOne(
      { _id, version: expectedVersion },
      fields,
    );
    if (result.matchedCount === 0) {
      throw new OrganizationVersionConflictError(organization.id);
    }
  }
}

function toDocument(organization: Organization): OrganizationDocument {
  return {
    _id: organization.id.value,
    name: organization.name.value,
    profile: organization.profile.value,
    status: organization.status,
    providerUpdatedAt: organization.providerUpdatedAt,
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt,
    version: organization.version,
    deletedAt: organization.deletedAt,
    deletedBy: organization.deletedBy,
  };
}

function toDomain(doc: OrganizationDocument): Organization {
  return Organization.restore(TeamId.of(doc._id), {
    name: OrganizationName.of(doc.name),
    profile: OrganizationProfile.of(doc.profile),
    status: doc.status,
    providerUpdatedAt: doc.providerUpdatedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    version: doc.version,
    deletedAt: doc.deletedAt,
    deletedBy: doc.deletedBy,
  });
}
