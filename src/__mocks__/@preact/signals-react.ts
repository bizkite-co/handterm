// Mock implementation of signals
export const signal = (initialValue: any) => ({
  value: initialValue,
  subscribe: jest.fn(),
  peek: () => initialValue
});

export const computed = (fn: () => any) => ({
  value: fn(),
  subscribe: jest.fn(),
  peek: fn
});

export const useSignal = (initialValue: any) => ({
  value: initialValue,
  subscribe: jest.fn(),
  peek: () => initialValue
});

export const useComputed = (fn: () => any) => fn();

export const effect = jest.fn();

export const batch = (fn: () => void) => fn();
