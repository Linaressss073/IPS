import { ActorResolver, Clock, newTraceEvent } from '../../../../shared/application/index.js';
import { colombiaDate, InvalidValueError } from '../../../../shared/domain/index.js';
import { Product, ProductId } from '../../domain/entities/product.entity.js';
import { Movement } from '../../domain/types/pharmacy.types.js';
import { movement } from './inventory.commands.js';
import { Dispensation, DispensationId } from '../../domain/entities/dispensation.entity.js';
import { MEDICATIONS_DELIVERED } from '../constants/pharmacy.tokens.js';
import {
  AlreadyDispensedError,
  DispensationVersionConflictError,
  WindowNotFoundError,
} from '../errors/pharmacy.errors.js';
import {
  DispensationRepository,
  PharmacyTurns,
  PharmacyWindows,
  PrescriptionSource,
  ProductRepository,
} from '../ports/pharmacy.ports.js';
import { PharmacyQueries } from '../queries/pharmacy.queries.js';
import { DispenseCommand, IssueTurnCommand, PharmacyPrescriptionView } from '../types/pharmacy.types.js';

/**
 * Delivers units of a signed prescription, taking each line's stock from
 * its catalog product by FEFO. The first delivery opens the dispensation;
 * later ones complete what is pending. Dispensation, stock and kardex are
 * stored together.
 */
export class Dispense {
  constructor(
    private readonly dispensations: DispensationRepository,
    private readonly products: ProductRepository,
    private readonly prescriptions: PrescriptionSource,
    private readonly queries: PharmacyQueries,
    private readonly actors: ActorResolver,
    private readonly clock: Clock,
  ) {}

  async execute(command: DispenseCommand): Promise<PharmacyPrescriptionView> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const prescription = await this.prescriptions.get(command.teamId, command.consultationId);
    const id = DispensationId.of(prescription.consultationId);
    const now = this.clock.now();
    const dispensation = (await this.dispensations.exists(command.teamId, id))
      ? await this.dispensations.getById(command.teamId, id)
      : Dispensation.open({
          teamId: command.teamId,
          consultationId: prescription.consultationId,
          patientId: prescription.patientId,
          prescribed: prescription.items.map((item) => ({
            medication: item.medication,
            presentation: item.presentation,
            dose: item.dose,
            route: item.route,
            frequency: item.frequency,
            durationDays: item.durationDays,
            prescribed: item.quantity,
          })),
          now,
        });
    if (dispensation.version !== command.expectedVersion) {
      throw new DispensationVersionConflictError(prescription.consultationId);
    }

    // Each product once, even if two lines share it.
    const products = new Map<string, Product>();
    for (const line of command.lines) {
      const id = ProductId.of(line.productId);
      if (!products.has(id.value)) products.set(id.value, await this.products.getById(command.teamId, id));
    }
    const productOf = new Map(command.lines.map((line) => [line.index, ProductId.of(line.productId).value]));
    if (productOf.size !== command.lines.length) throw new InvalidValueError('Each prescription item goes once');
    const today = colombiaDate(now);
    const movements: Movement[] = [];

    const delivery = dispensation.deliver({
      lines: command.lines.map((line) => ({ index: line.index, quantity: line.quantity })),
      note: command.note,
      deliveredBy: actor.executedBy.value,
      now,
      allocate: (line) => {
        const product = products.get(productOf.get(line.index)!)!;
        const lots = product.take(line.quantity, today, now);
        for (const lot of lots) {
          movements.push(
            movement({
              productId: product.id.value,
              type: 'salida',
              lotNumber: lot.lotNumber,
              quantity: -lot.quantity,
              reference: { kind: 'dispensacion', consultationId: prescription.consultationId },
              at: now,
              by: actor.executedBy.value,
            }),
          );
        }
        return { productId: product.id.value, lots };
      },
    });
    const touched = [...products.values()].filter((product) => movements.some((m) => m.productId === product.id.value));
    await this.dispensations.saveDelivery(dispensation, touched, movements, [
      newTraceEvent({
        teamId: command.teamId,
        patientId: dispensation.patientId,
        type: MEDICATIONS_DELIVERED,
        actor,
        occurredAt: now,
        data: {
          consultationId: dispensation.consultationId,
          status: dispensation.status,
          units: delivery.lines.reduce((sum, line) => sum + line.quantity, 0),
        },
      }),
    ]);
    return this.queries.get(command.teamId, prescription.consultationId);
  }
}

/** Gives the patient a "FAR n" turn at a pharmacy window, on the waiting-room screen. */
export class IssuePharmacyTurnForPrescription {
  constructor(
    private readonly prescriptions: PrescriptionSource,
    private readonly queries: PharmacyQueries,
    private readonly windows: PharmacyWindows,
    private readonly turns: PharmacyTurns,
    private readonly actors: ActorResolver,
  ) {}

  async execute(command: IssueTurnCommand) {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const prescription = await this.prescriptions.get(command.teamId, command.consultationId);
    const { status } = await this.queries.get(command.teamId, prescription.consultationId);
    if (status === 'completa') throw new AlreadyDispensedError();
    const window = (await this.windows.list(command.teamId)).find((w) => w.id === command.windowId && w.active);
    if (!window) throw new WindowNotFoundError(command.windowId);
    return this.turns.issue({
      teamId: command.teamId,
      consultationId: prescription.consultationId,
      patientId: prescription.patientId,
      window: { id: window.id, label: window.label },
      executedBy: actor.executedBy.value,
    });
  }
}
