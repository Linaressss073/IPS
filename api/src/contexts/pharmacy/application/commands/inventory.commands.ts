import { ActorInput, ActorResolver, Clock } from '../../../../shared/application/index.js';
import { colombiaDate, generateUuid, TeamId } from '../../../../shared/domain/index.js';
import { Product, ProductId } from '../../domain/entities/product.entity.js';
import { Movement, MovementReference } from '../../domain/types/pharmacy.types.js';
import { ProductRepository } from '../ports/pharmacy.ports.js';
import { InventoryQueries } from '../queries/inventory.queries.js';
import { ProductView } from '../types/pharmacy.types.js';

export function movement(input: {
  productId: string;
  type: Movement['type'];
  lotNumber: string;
  quantity: number;
  reference: MovementReference;
  at: Date;
  by: string;
}): Movement {
  return { id: generateUuid(), ...input };
}

/** Adds a medication to the pharmacy's catalog (no stock until a lot is received). */
export class CreateProduct {
  constructor(
    private readonly products: ProductRepository,
    private readonly queries: InventoryQueries,
    private readonly clock: Clock,
  ) {}

  async execute(command: { teamId: TeamId; name: string; presentation: string; minStock: number }): Promise<ProductView> {
    const product = Product.create({ ...command, now: this.clock.now() });
    await this.products.add(product);
    return this.queries.get(command.teamId, product.id.value);
  }
}

export class UpdateProduct {
  constructor(
    private readonly products: ProductRepository,
    private readonly queries: InventoryQueries,
    private readonly clock: Clock,
  ) {}

  async execute(command: {
    teamId: TeamId;
    productId: string;
    minStock?: number;
    active?: boolean;
  }): Promise<ProductView> {
    const product = await this.products.getById(command.teamId, ProductId.of(command.productId));
    product.update({ minStock: command.minStock, active: command.active }, this.clock.now());
    await this.products.save(product, []);
    return this.queries.get(command.teamId, product.id.value);
  }
}

/** A lot arrives: an "entrada" in the kardex. */
export class ReceiveLot {
  constructor(
    private readonly products: ProductRepository,
    private readonly queries: InventoryQueries,
    private readonly actors: ActorResolver,
    private readonly clock: Clock,
  ) {}

  async execute(command: {
    teamId: TeamId;
    productId: string;
    lotNumber: string;
    expiresOn: string;
    quantity: number;
    supplier: string;
    actor: ActorInput;
  }): Promise<ProductView> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const product = await this.products.getById(command.teamId, ProductId.of(command.productId));
    const now = this.clock.now();
    const lot = product.receive({ ...command, today: colombiaDate(now), now });
    await this.products.save(product, [
      movement({
        productId: product.id.value,
        type: 'entrada',
        lotNumber: lot.lotNumber,
        quantity: command.quantity,
        reference: { kind: 'recepcion', supplier: (command.supplier ?? '').trim() },
        at: now,
        by: actor.executedBy.value,
      }),
    ]);
    return this.queries.get(command.teamId, product.id.value);
  }
}

/** A correction or write-off (counted, damaged, expired): an "ajuste" with its reason. */
export class AdjustLot {
  constructor(
    private readonly products: ProductRepository,
    private readonly queries: InventoryQueries,
    private readonly actors: ActorResolver,
    private readonly clock: Clock,
  ) {}

  async execute(command: {
    teamId: TeamId;
    productId: string;
    lotNumber: string;
    quantity: number;
    reason: string;
    actor: ActorInput;
  }): Promise<ProductView> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const product = await this.products.getById(command.teamId, ProductId.of(command.productId));
    const now = this.clock.now();
    product.adjust({ ...command, now });
    await this.products.save(product, [
      movement({
        productId: product.id.value,
        type: 'ajuste',
        lotNumber: command.lotNumber.trim().toUpperCase(),
        quantity: command.quantity,
        reference: { kind: 'ajuste', reason: command.reason.trim() },
        at: now,
        by: actor.executedBy.value,
      }),
    ]);
    return this.queries.get(command.teamId, product.id.value);
  }
}
