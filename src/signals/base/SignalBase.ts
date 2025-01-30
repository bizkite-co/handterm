import type { Signal } from '@handterm/types';

export abstract class SignalBase<T> implements Signal<T> {
  abstract readonly type: string;
  private _value!: T;
  abstract readonly brand: symbol;
  readonly key: string;
  readonly props: Record<string, unknown> = {};
  protected readonly subscribers = new Set<(value: T) => void>();

  constructor() {
    this.key = `signal_${Math.random().toString(36).slice(2, 9)}`;
  }

  toJSON(): T {
    return this._value;
  }

  peek(): T {
    return this._value;
  }

  valueOf(): T {
    return this._value;
  }

  protected notifySubscribers(): void {
    this.subscribers.forEach(cb => cb(this._value));
  }
  get value(): T {
    return this._value;
  }

  set(value: T): void {
    this._value = value;
    this.notifySubscribers();
  }

  abstract subscribe(callback: (value: T) => void): () => void;
}
