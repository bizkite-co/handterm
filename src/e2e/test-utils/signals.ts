/**
 * A minimal signal interface for testing purposes.
 * Based on the implementation in signal-storage-interaction.spec.ts
 */
export interface TestSignal<T> {
  value: T;
  subscribers: Set<(value: T) => void>;
  subscribe: (fn: (value: T) => void) => () => boolean;
}

/**
 * Creates a minimal signal implementation for testing.
 * This provides just enough functionality to make our tests work,
 * including proper subscriber handling.
 */
export function createTestSignal<T>(initialValue: T): TestSignal<T> {
  return {
    value: initialValue,
    subscribers: new Set<(value: T) => void>(),
    subscribe(fn: (value: T) => void) {
      this.subscribers.add(fn);
      return () => this.subscribers.delete(fn);
    }
  };
}

/**
 * Creates a signal that reads its initial value from localStorage.
 * @param key The localStorage key to read from
 * @param defaultValue The default value if nothing exists in localStorage
 * @param deserialize Function to deserialize the stored value (defaults to JSON.parse)
 */
export function createStorageSignal<T>(
  key: string,
  defaultValue: T,
  deserialize: (stored: string) => T = JSON.parse
): TestSignal<T> {
  const stored = localStorage.getItem(key);
  const initialValue = stored ? deserialize(stored) : defaultValue;
  return createTestSignal(initialValue);
}