import {
  Entity,
  generateUuid,
  InvalidValueError,
  isUuid,
  parseCalendarDate,
  TeamId,
  ValueObject,
} from '../../../../shared/domain/index.js';
import {
  ADJUSTMENT_REASON,
  LOT_NUMBER_PATTERN,
  MAX_RECEIPT_QUANTITY,
  PRODUCT_TEXT_MAX,
} from '../constants/pharmacy.constants.js';
import {
  ExpiredLotError,
  InactiveProductError,
  InsufficientStockError,
  LotExpiryMismatchError,
  LotNotFoundError,
  NegativeStockError,
} from '../errors/pharmacy.errors.js';
import { LotAllocation, LotProps } from '../types/pharmacy.types.js';

export class ProductId extends ValueObject<string> {
  static generate(): ProductId {
    return new ProductId(generateUuid());
  }

  static of(value: string): ProductId {
    if (!isUuid(value ?? '')) throw new InvalidValueError(`Invalid product id: "${value}"`);
    return new ProductId(value.toLowerCase());
  }
}

export interface ProductProps {
  teamId: TeamId;
  name: string;
  presentation: string;
  /** At or below this stock (not expired) the product shows in the "stock bajo" alert. */
  minStock: number;
  active: boolean;
  lots: LotProps[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

function text(value: string, field: string): string {
  const trimmed = (value ?? '').trim().replace(/\s+/g, ' ');
  if (!trimmed || trimmed.length > PRODUCT_TEXT_MAX) {
    throw new InvalidValueError(`${field} must have between 1 and ${PRODUCT_TEXT_MAX} characters`);
  }
  return trimmed;
}

function wholeNumber(value: number, field: string, min: number, max: number): number {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new InvalidValueError(`${field} must be a whole number from ${min} to ${max}`);
  }
  return value;
}

/**
 * Aggregate root: a medication of the IPS's pharmacy and its lots. Stock
 * leaves by FEFO (first expired, first out) and never from expired lots.
 * `today` is the Colombian date (YYYY-MM-DD) of the operation.
 */
export class Product extends Entity<ProductId> {
  private constructor(
    id: ProductId,
    private props: ProductProps,
  ) {
    super(id);
  }

  static create(input: { teamId: TeamId; name: string; presentation: string; minStock: number; now: Date }): Product {
    return new Product(ProductId.generate(), {
      teamId: input.teamId,
      name: text(input.name, 'name'),
      presentation: text(input.presentation, 'presentation'),
      minStock: wholeNumber(input.minStock, 'minStock', 0, MAX_RECEIPT_QUANTITY),
      active: true,
      lots: [],
      createdAt: input.now,
      updatedAt: input.now,
      version: 1,
    });
  }

  static restore(id: ProductId, props: ProductProps): Product {
    return new Product(id, { ...props, lots: props.lots.map((lot) => ({ ...lot })) });
  }

  update(changes: { minStock?: number; active?: boolean }, now: Date): void {
    if (changes.minStock !== undefined) {
      this.props.minStock = wholeNumber(changes.minStock, 'minStock', 0, MAX_RECEIPT_QUANTITY);
    }
    if (changes.active !== undefined) this.props.active = changes.active;
    this.touch(now);
  }

  /** A lot arrives (or more units of a lot already in stock). */
  receive(input: { lotNumber: string; expiresOn: string; quantity: number; today: string; now: Date }): LotProps {
    const lotNumber = (input.lotNumber ?? '').trim().toUpperCase();
    if (!LOT_NUMBER_PATTERN.test(lotNumber)) {
      throw new InvalidValueError('lotNumber must be 1 to 30 letters, digits or "-"');
    }
    const expiresOn = parseCalendarDate(input.expiresOn, 'expiresOn');
    if (expiresOn < input.today) throw new ExpiredLotError(lotNumber);
    const quantity = wholeNumber(input.quantity, 'quantity', 1, MAX_RECEIPT_QUANTITY);

    const existing = this.props.lots.find((lot) => lot.lotNumber === lotNumber);
    if (existing && existing.expiresOn !== expiresOn) throw new LotExpiryMismatchError(lotNumber, existing.expiresOn);
    if (existing) existing.quantity += quantity;
    else this.props.lots.push({ lotNumber, expiresOn, quantity, receivedAt: input.now });
    this.touch(input.now);
    return this.props.lots.find((lot) => lot.lotNumber === lotNumber)!;
  }

  /** Correction or write-off of a lot (counted stock, damaged, expired). Signed quantity. */
  adjust(input: { lotNumber: string; quantity: number; reason: string; now: Date }): void {
    const lot = this.props.lots.find((l) => l.lotNumber === (input.lotNumber ?? '').trim().toUpperCase());
    if (!lot) throw new LotNotFoundError(input.lotNumber);
    if (!Number.isInteger(input.quantity) || input.quantity === 0) {
      throw new InvalidValueError('quantity must be a whole number other than 0');
    }
    const reason = (input.reason ?? '').trim();
    if (reason.length < ADJUSTMENT_REASON.min || reason.length > ADJUSTMENT_REASON.max) {
      throw new InvalidValueError(`reason must have between ${ADJUSTMENT_REASON.min} and ${ADJUSTMENT_REASON.max} characters`);
    }
    if (lot.quantity + input.quantity < 0) throw new NegativeStockError(lot.lotNumber, lot.quantity);
    lot.quantity += input.quantity;
    this.touch(input.now);
  }

  /** Takes units for a dispensation, from the lots that expire first. */
  take(quantity: number, today: string, now: Date): LotAllocation[] {
    if (!this.props.active) throw new InactiveProductError(this.label);
    const available = this.available(today);
    if (quantity > available) throw new InsufficientStockError(this.label, available);
    const allocations: LotAllocation[] = [];
    let missing = quantity;
    for (const lot of this.usableLots(today)) {
      if (missing === 0) break;
      const taken = Math.min(lot.quantity, missing);
      lot.quantity -= taken;
      missing -= taken;
      allocations.push({ lotNumber: lot.lotNumber, expiresOn: lot.expiresOn, quantity: taken });
    }
    this.touch(now);
    return allocations;
  }

  /** Units that can be dispensed today (not expired). */
  available(today: string): number {
    return this.usableLots(today).reduce((sum, lot) => sum + lot.quantity, 0);
  }

  /** Units in lots already expired: to write off. */
  expired(today: string): number {
    return this.props.lots.filter((lot) => lot.expiresOn < today).reduce((sum, lot) => sum + lot.quantity, 0);
  }

  get label(): string {
    return `${this.props.name} (${this.props.presentation})`;
  }
  get teamId(): TeamId {
    return this.props.teamId;
  }
  get name(): string {
    return this.props.name;
  }
  get presentation(): string {
    return this.props.presentation;
  }
  get minStock(): number {
    return this.props.minStock;
  }
  get active(): boolean {
    return this.props.active;
  }
  get lots(): readonly LotProps[] {
    return this.props.lots;
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

  /** Lots with units and not expired, the one expiring first first. */
  private usableLots(today: string): LotProps[] {
    return this.props.lots
      .filter((lot) => lot.quantity > 0 && lot.expiresOn >= today)
      .sort((a, b) => a.expiresOn.localeCompare(b.expiresOn) || a.receivedAt.getTime() - b.receivedAt.getTime());
  }

  private touch(now: Date): void {
    this.props.updatedAt = now;
    this.props.version += 1;
  }
}
