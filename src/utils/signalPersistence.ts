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
        try {
            // Use test storage if available
            const storage = typeof localStorage !== 'undefined' ? localStorage :
                typeof window !== 'undefined' && window.localStorage ? window.localStorage :
                    { getItem: () => null, setItem: () => {} };

            const storedValue = storage.getItem(key);
            if (storedValue != null) {
                signal.value = deserialize(storedValue);
            }
        } catch (error) {
            console.warn('Failed to access storage:', error);
        }
    };

    const persistToLocalStorage = (value: T) => {
        console.log(`[persistToLocalStorage] key: ${key}, value:`, value); // Added log
        if (key == 'completed-tutorials') {
            console.log('Completing tutorial', value);
        }
        queueMicrotask(() => {
            const storage = typeof localStorage !== 'undefined' ? localStorage :
                typeof window !== 'undefined' && window.localStorage ? window.localStorage :
                    { getItem: () => null, setItem: () => {} };

            storage.setItem(key, serialize(value));
        });
    };

    // Load initial state
    console.log(`[createPersistentSignal] Before loadInitialState, key: ${key}`); // Added log
    loadInitialState();
    console.log(`[createPersistentSignal] After loadInitialState, key: ${key}`); // Added log

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
