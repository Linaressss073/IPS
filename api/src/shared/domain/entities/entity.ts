import { ValueObject } from './value-object.js';

/**
 * An Entity is defined by its identity, not by its attributes: two entities
 * with the same id are the same entity even if their state differs.
 */
export abstract class Entity<TId extends ValueObject<unknown>> {
  protected constructor(protected readonly _id: TId) {}

  get id(): TId {
    return this._id;
  }

  equals(other?: Entity<TId>): boolean {
    return !!other && this._id.equals(other._id);
  }
}
