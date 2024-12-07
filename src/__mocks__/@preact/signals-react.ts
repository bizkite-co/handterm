// Mock implementation of signals
export const signal = <T>(initialValue: T) => ({
  value: initialValue,
  subscribe: jest.fn(),
  peek: () => initialValue
});

export const computed = <T>(fn: () => T) => ({
  value: fn(),
  subscribe: jest.fn(),
  peek: fn
});

export const useSignal = <T>(initialValue: T) => ({
  value: initialValue,
  subscribe: jest.fn(),
  peek: () => initialValue
});

export const useComputed = <T>(fn: () => T) => fn();

export const effect = jest.fn();

export const batch = (fn: () => void) => fn();
