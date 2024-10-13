import { Signal } from "@preact/signals-react";

export interface PersistenceConfig<T> {
  key: string;
  signal: Signal<T>;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}

export function createPersistentSignal<T>({
  key,
  signal,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
}: PersistenceConfig<T>) {
  const loadInitialState = () => {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      signal.value = deserialize(storedValue);
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
    console.log('Signal updated:', signal.value);
    persistToLocalStorage(signal.value);
  };

  return { signal, update: updateSignal };
}