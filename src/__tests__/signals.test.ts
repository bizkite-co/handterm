import { createPersistentSignal } from '../utils/signalPersistence';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@preact/signals-react';

// Mock localStorage for testing
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

declare global {
    interface Window {
        localStorage: any;
    }
}

describe('createPersistentSignal', () => {
    beforeEach(() => {
        // Reset mocks before each test
        localStorageMock.getItem.mockReset();
        localStorageMock.setItem.mockReset();
        localStorageMock.removeItem.mockReset();
        localStorageMock.clear.mockReset();
        (window as any).localStorage = localStorageMock;
    });

    it('should initialize with the provided initial value', () => {
        const initialValue = { test: 'value' };
        const persistentSignal = createPersistentSignal({ key: 'testSignal', signal: signal(initialValue) });
        expect(persistentSignal.signal.value).toEqual(initialValue);
    });

  it('should update localStorage when the signal value changes', () => {
    const initialValue = { test: 'value' };
    const persistentSignal = createPersistentSignal({ key: 'testSignal', signal: signal(initialValue) });
    const newValue = { test: 'newValue' };
    persistentSignal.update(newValue);
    return Promise.resolve().then(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('testSignal', JSON.stringify(newValue));
    });
  });

  it('should load initial value from localStorage if it exists', () => {
    const storedValue = { test: 'storedValue' };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(storedValue));
    const persistentSignal = createPersistentSignal({ key: 'testSignal', signal: signal({ test: 'initialValue' }) });
    return Promise.resolve().then(() => {
      expect(persistentSignal.signal.value).toEqual(storedValue);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('testSignal');
    });
  });

  it('should handle invalid JSON in localStorage gracefully', () => {
    localStorageMock.getItem.mockReturnValueOnce('invalid json');
    const persistentSignal = createPersistentSignal({ key: 'testSignal', signal: signal({ test: 'initial' }) });
    return Promise.resolve().then(() => {
      expect(persistentSignal.signal.value).toEqual({ test: 'initial' }); // Should fall back to initial value
    });
  });

  it('should call subscribers when the signal value changes', () => {
    const persistentSignal = createPersistentSignal({ key: 'testSignal', signal: signal(0) });
    const subscriber = vi.fn();
    persistentSignal.signal.subscribe(subscriber);
    persistentSignal.signal.value = 1;
    return Promise.resolve().then(() => {
      expect(subscriber).toHaveBeenCalledWith(1);
    });
  });

  // it('should unsubscribe correctly', () => {
  //   const persistentSignal = createPersistentSignal({ key: 'testSignal', signal: signal(0) });
  //   const subscriber = vi.fn();
  //   console.log("Before subscribe - unsubscribe test");
  //   const unsubscribe = persistentSignal.signal.subscribe(subscriber);
  //   console.log("After subscribe - unsubscribe test, unsubscribe:", unsubscribe);
  //   unsubscribe();
  //   console.log("After unsubscribe - unsubscribe test");
  //   persistentSignal.signal.value = 1;
  //   return Promise.resolve().then(() => {
  //     console.log("Checking subscriber calls... - unsubscribe test", subscriber.mock);
  //     expect(subscriber).not.toHaveBeenCalled();
  //   });
  // });
});