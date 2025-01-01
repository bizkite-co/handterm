import { type Signal } from "@preact/signals-react";

export interface PersistenceConfig<T> {
  key: string;
  signal: Signal<T>;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}

interface PersistentSignal<T> {
  signal: Signal<T>;
  update: (newValue: T | ((prev: T) => T)) => void;
}

export function createPersistentSignal<T>({
  key,
  signal,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
}: PersistenceConfig<T>): PersistentSignal<T> {
  const loadInitialState = () => {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue != null) {
        signal.value = deserialize(storedValue);
      }
    } catch (error) {
      console.warn('Failed to access localStorage:', error);
    }
  };

  const persistToLocalStorage = (value: T) => {
    queueMicrotask(() => {
      localStorage.setItem(key, serialize(value));
    });
  };

  // Load initial state
  loadInitialState();

  const updateSignal = (newValue: T | ((prev: T) => T)) => {
    if (typeof newValue === 'function') {
      signal.value = (newValue as (prev: T) => T)(signal.value);
    } else {
      signal.value = newValue;
    }
    persistToLocalStorage(signal.value);
  };

  return { signal, update: updateSignal };
}
