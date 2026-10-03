import type { ClientSession, Collection, Db, MongoClient } from 'mongodb';
import { normalizeForSearch, TeamId } from '../../../../shared/domain/index.js';
import {
  inTransaction,
  isDuplicateKey,
} from '../../../../shared/infrastructure/persistence/mongo.js';
import {
  ProductNotFoundError,
  ProductTakenError,
  StockChangedError,
} from '../../application/errors/pharmacy.errors.js';
import { ProductRepository } from '../../application/ports/pharmacy.ports.js';
import { Product, ProductId } from '../../domain/entities/product.entity.js';
import { LotProps, Movement } from '../../domain/types/pharmacy.types.js';

export const PRODUCTS_COLLECTION = 'pharmacy_products';
export const MOVEMENTS_COLLECTION = 'pharmacy_movements';

interface ProductDocument {
  _id: string;
  teamId: string;
  name: string;
  presentation: string;
  /** Accent-free, lower-case name + presentation: unique per team. */
  key: string;
  minStock: number;
  active: boolean;
  lots: LotProps[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

interface MovementDocument extends Omit<Movement, 'id'> {
  _id: string;
  teamId: string;
}

export async function ensureProductIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection(PRODUCTS_COLLECTION).createIndex({ teamId: 1, key: 1 }, { unique: true, name: 'team_key_uq' }),
    db.collection(MOVEMENTS_COLLECTION).createIndex({ teamId: 1, productId: 1, at: -1 }, { name: 'team_product' }),
  ]);
}

function toDocument(product: Product): ProductDocument {
  return {
    _id: product.id.value,
    teamId: product.teamId.value,
    name: product.name,
    presentation: product.presentation,
    key: normalizeForSearch(`${product.name} | ${product.presentation}`),
    minStock: product.minStock,
    active: product.active,
    lots: [...product.lots],
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    version: product.version,
  };
}

function toDomain(doc: ProductDocument): Product {
  return Product.restore(ProductId.of(doc._id), {
    teamId: TeamId.of(doc.teamId),
    name: doc.name,
    presentation: doc.presentation,
    minStock: doc.minStock,
    active: doc.active,
    lots: doc.lots,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    version: doc.version,
  });
}

/**
 * Saves products changed in a transaction (optimistic locking on `version`)
 * and their kardex lines. Shared by product changes and deliveries.
 */
export async function writeStock(
  db: Db,
  session: ClientSession,
  products: readonly Product[],
  movements: readonly Movement[],
): Promise<void> {
  const collection = db.collection<ProductDocument>(PRODUCTS_COLLECTION);
  for (const product of products) {
    const { _id, teamId, ...fields } = toDocument(product);
    const result = await collection.updateOne(
      { _id, teamId, version: product.version - 1 },
      { $set: fields },
      { session },
    );
    if (result.matchedCount === 0) throw new StockChangedError(product.label);
  }
  if (movements.length === 0) return;
  const teamOf = new Map(products.map((p) => [p.id.value, p.teamId.value]));
  await db.collection<MovementDocument>(MOVEMENTS_COLLECTION).insertMany(
    movements.map(({ id, ...movement }) => ({ _id: id, teamId: teamOf.get(movement.productId) ?? '', ...movement })),
    { session },
  );
}

export class MongoProductRepository implements ProductRepository {
  private readonly products: Collection<ProductDocument>;

  constructor(
    private readonly client: MongoClient,
    private readonly db: Db,
  ) {
    this.products = db.collection<ProductDocument>(PRODUCTS_COLLECTION);
  }

  async getById(teamId: TeamId, id: ProductId): Promise<Product> {
    const doc = await this.products.findOne({ _id: id.value, teamId: teamId.value });
    if (!doc) throw new ProductNotFoundError(id.value);
    return toDomain(doc);
  }

  async list(teamId: TeamId): Promise<Product[]> {
    const docs = await this.products.find({ teamId: teamId.value }).sort({ name: 1, presentation: 1 }).toArray();
    return docs.map(toDomain);
  }

  async add(product: Product): Promise<void> {
    try {
      await this.products.insertOne(toDocument(product));
    } catch (error) {
      if (isDuplicateKey(error)) throw new ProductTakenError(product.label);
      throw error;
    }
  }

  async save(product: Product, movements: readonly Movement[]): Promise<void> {
    await inTransaction(this.client, (session) => writeStock(this.db, session, [product], movements));
  }

  async movements(teamId: TeamId, id: ProductId): Promise<Movement[]> {
    const docs = await this.db
      .collection<MovementDocument>(MOVEMENTS_COLLECTION)
      .find({ teamId: teamId.value, productId: id.value })
      .sort({ at: -1, _id: 1 })
      .limit(500)
      .toArray();
    return docs.map(({ _id, teamId: _team, ...movement }) => ({ id: _id, ...movement }));
  }
}
