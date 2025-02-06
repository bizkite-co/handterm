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
        expect(localStorageMock.setItem).toHaveBeenCalledWith('testSignal', JSON.stringify(newValue));
    });

    it('should load initial value from localStorage if it exists', () => {
        const storedValue = { test: 'storedValue' };
        localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(storedValue));
        const persistentSignal = createPersistentSignal({ key: 'testSignal', signal: signal({ test: 'initialValue' }) });
        expect(persistentSignal.signal.value).toEqual(storedValue);
        expect(localStorageMock.getItem).toHaveBeenCalledWith('testSignal');
    });

    it('should handle invalid JSON in localStorage gracefully', () => {
        localStorageMock.getItem.mockReturnValueOnce('invalid json');
        const persistentSignal = createPersistentSignal({ key: 'testSignal', signal: signal({ test: 'initial' }) });
        expect(persistentSignal.signal.value).toEqual({ test: 'initial' }); // Should fall back to initial value
    });

    it('should call subscribers when the signal value changes', () => {
        const persistentSignal = createPersistentSignal({ key: 'testSignal', signal: signal(0) });
        const subscriber = vi.fn();
        persistentSignal.signal.subscribe(subscriber);
        persistentSignal.signal.value = 1;
        expect(subscriber).toHaveBeenCalledWith(1);
    });

    it('should unsubscribe correctly', () => {
        const persistentSignal = createPersistentSignal({ key: 'testSignal', signal: signal(0) });
        const subscriber = vi.fn();
        const unsubscribe = persistentSignal.signal.subscribe(subscriber);
        unsubscribe();
        persistentSignal.signal.value = 1;
        expect(subscriber).not.toHaveBeenCalled();
    });
});