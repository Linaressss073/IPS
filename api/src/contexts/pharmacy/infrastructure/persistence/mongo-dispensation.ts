import type { Collection, Db, MongoClient } from 'mongodb';
import { TraceEvent } from '../../../../shared/application/index.js';
import { DomainError, TeamId } from '../../../../shared/domain/index.js';
import {
  inTransaction,
  isDuplicateKey,
} from '../../../../shared/infrastructure/persistence/mongo.js';
import { appendTraceEvents } from '../../../../shared/infrastructure/persistence/trace-event.writer.js';
import { DispensationVersionConflictError } from '../../application/errors/pharmacy.errors.js';
import { DispensationRepository } from '../../application/ports/pharmacy.ports.js';
import { Dispensation, DispensationId } from '../../domain/entities/dispensation.entity.js';
import { Product } from '../../domain/entities/product.entity.js';
import { DeliveryProps, DispensedItemProps, Movement } from '../../domain/types/pharmacy.types.js';
import { writeStock } from './mongo-product.js';

export const DISPENSATIONS_COLLECTION = 'pharmacy_dispensations';

/** `_id` is the consultation id: one dispensation per prescription. */
interface DispensationDocument {
  _id: string;
  teamId: string;
  patientId: string;
  items: DispensedItemProps[];
  deliveries: DeliveryProps[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

class DispensationNotFoundError extends DomainError {
  readonly kind = 'not-found';

  constructor(id: string) {
    super(`No dispensation for consultation ${id}`, 'DISPENSATION_NOT_FOUND');
  }
}

export async function ensureDispensationIndexes(db: Db): Promise<void> {
  await db
    .collection(DISPENSATIONS_COLLECTION)
    .createIndex({ teamId: 1, patientId: 1, updatedAt: -1 }, { name: 'team_patient' });
}

function toDomain(doc: DispensationDocument): Dispensation {
  return Dispensation.restore(DispensationId.of(doc._id), {
    teamId: TeamId.of(doc.teamId),
    patientId: doc.patientId,
    items: doc.items,
    // Deliveries made before the inventory existed have no product or lots.
    deliveries: doc.deliveries.map((delivery) => ({
      ...delivery,
      lines: delivery.lines.map((line) => ({ ...line, productId: line.productId ?? '', lots: line.lots ?? [] })),
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    version: doc.version,
  });
}

export class MongoDispensationRepository implements DispensationRepository {
  private readonly dispensations: Collection<DispensationDocument>;

  constructor(
    private readonly client: MongoClient,
    private readonly db: Db,
  ) {
    this.dispensations = db.collection<DispensationDocument>(DISPENSATIONS_COLLECTION);
  }

  async findMany(teamId: TeamId, consultationIds: readonly string[]): Promise<Dispensation[]> {
    const docs = await this.dispensations
      .find({ teamId: teamId.value, _id: { $in: [...consultationIds] } })
      .toArray();
    return docs.map(toDomain);
  }

  async exists(teamId: TeamId, id: DispensationId): Promise<boolean> {
    return (await this.dispensations.countDocuments({ _id: id.value, teamId: teamId.value }, { limit: 1 })) > 0;
  }

  async getById(teamId: TeamId, id: DispensationId): Promise<Dispensation> {
    const doc = await this.dispensations.findOne({ _id: id.value, teamId: teamId.value });
    if (!doc) throw new DispensationNotFoundError(id.value);
    return toDomain(doc);
  }

  /**
   * The first delivery inserts the dispensation (version 1); later ones
   * update the previous version. Stock and kardex go in the same transaction.
   */
  async saveDelivery(
    dispensation: Dispensation,
    products: readonly Product[],
    movements: readonly Movement[],
    events: readonly TraceEvent[],
  ): Promise<void> {
    const doc: DispensationDocument = {
      _id: dispensation.consultationId,
      teamId: dispensation.teamId.value,
      patientId: dispensation.patientId,
      items: [...dispensation.items],
      deliveries: [...dispensation.deliveries],
      status: dispensation.status,
      createdAt: dispensation.createdAt,
      updatedAt: dispensation.updatedAt,
      version: dispensation.version,
    };
    try {
      await inTransaction(this.client, async (session) => {
        if (doc.version === 1) {
          await this.dispensations.insertOne(doc, { session });
        } else {
          const { _id, teamId, ...fields } = doc;
          const result = await this.dispensations.updateOne(
            { _id, teamId, version: doc.version - 1 },
            { $set: fields },
            { session },
          );
          if (result.matchedCount === 0) throw new DispensationVersionConflictError(_id);
        }
        await writeStock(this.db, session, products, movements);
        await appendTraceEvents(this.db, events, session);
      });
    } catch (error) {
      // Two first deliveries at once: the second finds it already created.
      if (isDuplicateKey(error)) throw new DispensationVersionConflictError(doc._id);
      throw error;
    }
  }
}
