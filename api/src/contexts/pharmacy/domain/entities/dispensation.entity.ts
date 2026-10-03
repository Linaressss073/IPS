import { Entity, InvalidValueError, TeamId, ValueObject } from '../../../../shared/domain/index.js';
import { DELIVERY_NOTE_MAX } from '../constants/pharmacy.constants.js';
import { NothingPendingError, OverDeliveryError } from '../errors/pharmacy.errors.js';
import {
  DeliveredLine,
  DeliveryLine,
  DeliveryProps,
  DispensationStatus,
  DispensedItemProps,
  PrescribedItem,
} from '../types/pharmacy.types.js';

/** A dispensation is identified by the consultation whose prescription it serves. */
export class DispensationId extends ValueObject<string> {
  static of(consultationId: string): DispensationId {
    return new DispensationId(consultationId);
  }
}

export interface DispensationProps {
  teamId: TeamId;
  patientId: string;
  items: DispensedItemProps[];
  deliveries: DeliveryProps[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

/**
 * Aggregate root: what the pharmacy delivered of one signed prescription.
 * Deliveries may be partial (no stock): what is missing stays pending and
 * can be delivered another day. Nothing beyond what was prescribed.
 */
export class Dispensation extends Entity<DispensationId> {
  private constructor(
    id: DispensationId,
    private props: DispensationProps,
  ) {
    super(id);
  }

  static open(input: {
    teamId: TeamId;
    consultationId: string;
    patientId: string;
    prescribed: PrescribedItem[];
    now: Date;
  }): Dispensation {
    return new Dispensation(DispensationId.of(input.consultationId), {
      teamId: input.teamId,
      patientId: input.patientId,
      items: input.prescribed.map((item, index) => ({ ...item, index, delivered: 0 })),
      deliveries: [],
      createdAt: input.now,
      updatedAt: input.now,
      version: 0,
    });
  }

  static restore(id: DispensationId, props: DispensationProps): Dispensation {
    return new Dispensation(id, { ...props, items: props.items.map((i) => ({ ...i })), deliveries: [...props.deliveries] });
  }

  /**
   * Delivers some units of some items (each at most what is pending). Lines
   * are checked first; only then `allocate` takes each line's stock, so an
   * invalid request never touches the inventory.
   */
  deliver(input: {
    lines: DeliveryLine[];
    note: string;
    deliveredBy: string;
    now: Date;
    allocate: (line: DeliveryLine, item: DispensedItemProps) => Pick<DeliveredLine, 'productId' | 'lots'>;
  }): DeliveryProps {
    if (this.status === 'completa') throw new NothingPendingError();
    const lines = input.lines.filter((line) => line.quantity !== 0);
    if (lines.length === 0) throw new InvalidValueError('Deliver at least one unit');
    const seen = new Set<number>();
    for (const line of lines) {
      const item = this.props.items[line.index];
      if (!item) throw new InvalidValueError(`There is no item ${line.index} in the prescription`);
      if (seen.has(line.index)) throw new InvalidValueError(`Item ${line.index} is repeated`);
      seen.add(line.index);
      if (!Number.isInteger(line.quantity) || line.quantity < 1) {
        throw new InvalidValueError('Quantities must be whole numbers from 1');
      }
      if (line.quantity > item.prescribed - item.delivered) {
        throw new OverDeliveryError(item.medication, item.prescribed - item.delivered);
      }
    }
    const note = (input.note ?? '').trim();
    if (note.length > DELIVERY_NOTE_MAX) {
      throw new InvalidValueError(`The note must have at most ${DELIVERY_NOTE_MAX} characters`);
    }
    const delivered: DeliveredLine[] = lines.map((line) => ({
      index: line.index,
      quantity: line.quantity,
      ...input.allocate(line, this.props.items[line.index]),
    }));
    for (const line of lines) this.props.items[line.index].delivered += line.quantity;
    const delivery = { at: input.now, by: input.deliveredBy, lines: delivered, note };
    this.props.deliveries.push(delivery);
    this.props.updatedAt = input.now;
    this.props.version += 1;
    return delivery;
  }

  get status(): DispensationStatus {
    const delivered = this.props.items.reduce((sum, item) => sum + item.delivered, 0);
    if (delivered === 0) return 'pendiente';
    return this.props.items.every((item) => item.delivered === item.prescribed) ? 'completa' : 'parcial';
  }
  get teamId(): TeamId {
    return this.props.teamId;
  }
  get consultationId(): string {
    return this.id.value;
  }
  get patientId(): string {
    return this.props.patientId;
  }
  get items(): readonly DispensedItemProps[] {
    return this.props.items;
  }
  get deliveries(): readonly DeliveryProps[] {
    return this.props.deliveries;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  /** 0 until the first delivery is stored. */
  get version(): number {
    return this.props.version;
  }
}
