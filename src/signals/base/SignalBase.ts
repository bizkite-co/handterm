import type { Signal } from '@handterm/types';

export abstract class SignalBase<T> implements Signal<T> {
  abstract readonly type: string;
  abstract value: T;
  readonly brand: unique symbol = Symbol('Signal');
  readonly key: string;
  readonly props: Record<string, unknown> = {};

  constructor() {
    this.key = `signal_${Math.random().toString(36).slice(2, 9)}`;
  }

  toJSON(): object {
    return {
      type: this.type,
      value: this.value,
      key: this.key
    };
  }

  peek(): T {
    return this.value;
  }

  abstract subscribe(callback: (value: T) => void): () => void;

  // Implement common signal utilities
  protected readonly subscribers = new Set<(value: T) => void>();

  protected notifySubscribers(): void {
    this.subscribers.forEach(cb => cb(this.value));
  }
}