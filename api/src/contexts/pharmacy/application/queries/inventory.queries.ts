import { Clock } from '../../../../shared/application/index.js';
import { colombiaDate, TeamId } from '../../../../shared/domain/index.js';
import { EXPIRY_WARNING_DAYS } from '../../domain/constants/pharmacy.constants.js';
import { Product, ProductId } from '../../domain/entities/product.entity.js';
import { PharmacyNames, ProductRepository } from '../ports/pharmacy.ports.js';
import { LotStatus, MovementView, ProductView, StockAlert } from '../types/pharmacy.types.js';

/** The catalog with today's stock and alerts, and each product's kardex. */
export class InventoryQueries {
  constructor(
    private readonly products: ProductRepository,
    private readonly names: PharmacyNames,
    private readonly clock: Clock,
  ) {}

  async list(teamId: TeamId): Promise<ProductView[]> {
    const today = colombiaDate(this.clock.now());
    return (await this.products.list(teamId)).map((product) => toProductView(product, today));
  }

  async get(teamId: TeamId, productId: string): Promise<ProductView> {
    const product = await this.products.getById(teamId, ProductId.of(productId));
    return toProductView(product, colombiaDate(this.clock.now()));
  }

  async movements(teamId: TeamId, productId: string): Promise<MovementView[]> {
    const movements = await this.products.movements(teamId, ProductId.of(productId));
    const names = await this.names.staff(movements.map((m) => m.by));
    return movements.map((m) => ({
      id: m.id,
      type: m.type,
      lotNumber: m.lotNumber,
      quantity: m.quantity,
      reference: m.reference,
      at: m.at.toISOString(),
      by: m.by,
      byName: names.get(m.by) ?? '',
    }));
  }
}

/** "2026-10-05" + 30 days → "2026-11-04". */
function addDays(date: string, days: number): string {
  const at = new Date(`${date}T12:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
}

export function toProductView(product: Product, today: string): ProductView {
  const warnUntil = addDays(today, EXPIRY_WARNING_DAYS);
  const lotStatus = (expiresOn: string): LotStatus =>
    expiresOn < today ? 'vencido' : expiresOn <= warnUntil ? 'por_vencer' : 'vigente';
  const lots = product.lots
    .filter((lot) => lot.quantity > 0)
    .map((lot) => ({ lotNumber: lot.lotNumber, expiresOn: lot.expiresOn, quantity: lot.quantity, status: lotStatus(lot.expiresOn) }))
    .sort((a, b) => a.expiresOn.localeCompare(b.expiresOn));
  const available = product.available(today);
  const alerts: StockAlert[] = [
    ...(product.active && available <= product.minStock ? (['stock_bajo'] as const) : []),
    ...(lots.some((lot) => lot.status === 'por_vencer') ? (['por_vencer'] as const) : []),
    ...(lots.some((lot) => lot.status === 'vencido') ? (['vencido'] as const) : []),
  ];
  return {
    id: product.id.value,
    name: product.name,
    presentation: product.presentation,
    label: product.label,
    minStock: product.minStock,
    active: product.active,
    available,
    expired: product.expired(today),
    lots,
    alerts,
    version: product.version,
  };
}
