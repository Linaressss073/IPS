/**
 * A Value Object has no identity: it is described only by its value, is
 * immutable and validates itself on creation.
 */
export abstract class ValueObject<T> {
  protected constructor(protected readonly _value: T) {
    Object.freeze(this);
  }

  get value(): T {
    return this._value;
  }

  equals(other?: ValueObject<T>): boolean {
    return (
      !!other &&
      other.constructor === this.constructor &&
      JSON.stringify(other._value) === JSON.stringify(this._value)
    );
  }

  toString(): string {
    return String(this._value);
  }
}
