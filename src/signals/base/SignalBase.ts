import type { Signal } from '@handterm/types';

export abstract class SignalBase<T> implements Signal<T> {
  abstract readonly type: string;
  abstract value: T;
  abstract readonly brand: symbol;
  readonly key: string;
  readonly props: Record<string, unknown> = {};
  protected readonly subscribers = new Set<(value: T) => void>();

  constructor() {
    this.key = `signal_${Math.random().toString(36).slice(2, 9)}`;
  }

  toJSON(): T {
    return this.value;
  }

  peek(): T {
    return this.value;
  }

  valueOf(): T {
    return this.value;
  }

  notifySubscribers(): void {
    this.subscribers.forEach(cb => cb(this.value));
  }

  abstract subscribe(callback: (value: T) => void): () => void;
}