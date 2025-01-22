import type { Signal as CoreSignal } from '@preact/signals-core';

/**
 * Common properties that extend the core signal functionality
 */
interface SignalExtensions<T> {
  /** Signal type identifier */
  readonly type: string;
  /** Additional properties for the signal */
  readonly props: Record<string, unknown>;
  /** Unique key for the signal */
  readonly key: string;
  /** Convert signal value to JSON */
  toJSON: () => T;
  /** String representation of signal value */
  toString: () => string;
  /** Get raw signal value */
  valueOf: () => T;
  /** Set signal value */
  set?: (value: T) => void;
}

/**
 * Extended Signal interface that combines CoreSignal with additional properties
 */
interface Signal<T> extends Omit<CoreSignal<T>, 'brand'>, SignalExtensions<T> {
  /** Signal brand */
  readonly brand: symbol;
  /** Get current value */
  value: T;
  /** Subscribe to value changes */
  subscribe: (callback: (value: T) => void) => () => void;
  /** Peek at current value without subscribing */
  peek: () => T;
}

/**
 * Options for creating a signal
 */
interface SignalOptions<T> {
  /** Initial value or getter */
  value: T | (() => T);
  /** Signal name/identifier */
  name: string;
  /** Optional subscribe implementation */
  subscribe?: (fn: (value: T) => void) => () => void;
  /** Optional setter implementation */
  setValue?: (value: T) => void;
}

/**
 * Creates a new signal with the given options
 */
function createSignalImpl<T>(options: SignalOptions<T>): Signal<T> {
  // Create value getter that handles both direct values and functions
  const getValue = (): T => {
    if (typeof options.value === 'function') {
      const fn = options.value as () => T;
      return fn();
    }
    return options.value;
  };

  const signal: Signal<T> = {
    get value() { return getValue(); },
    set value(v: T) { options.setValue?.(v); },
    subscribe: options.subscribe ?? (() => () => undefined),
    peek: getValue,
    type: options.name,
    props: {},
    key: options.name,
    toJSON: getValue,
    toString: () => String(getValue()),
    valueOf: getValue,
    brand: Symbol.for(options.name),
    set: options.setValue
  };

  return signal;
}

/**
 * Type guard for checking if a value is a Signal
 */
function isSignalImpl<T>(value: unknown): value is Signal<T> {
  return value !== null &&
         typeof value === 'object' &&
         'value' in value &&
         'subscribe' in value &&
         'peek' in value;
}

// Export types and implementations
export type { CoreSignal, Signal, SignalOptions, SignalExtensions };
export const createSignal = createSignalImpl;
export const isSignal = isSignalImpl;