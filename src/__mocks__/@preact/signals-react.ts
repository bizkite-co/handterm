// Mock implementation of signals
/**
 * Creates a mock signal
 * @param initialValue - The initial value for the signal
 * @returns Mock signal object
 */
export const signal = <T>(initialValue: T): { value: T; subscribe: jest.Mock; peek: () => T } => ({
  value: initialValue,
  subscribe: jest.fn(),
  peek: () => initialValue
});

/**
 * Creates a mock computed signal
 * @param fn - The computation function
 * @returns Mock computed signal object
 */
export const computed = <T>(fn: () => T): { value: T; subscribe: jest.Mock; peek: () => T } => ({
  value: fn(),
  subscribe: jest.fn(),
  peek: fn
});

/**
 * Creates a mock signal for React hook usage
 * @param initialValue - The initial value for the signal
 * @returns Mock signal object
 */
export const useSignal = <T>(initialValue: T): { value: T; subscribe: jest.Mock; peek: () => T } => ({
  value: initialValue,
  subscribe: jest.fn(),
  peek: () => initialValue
});

/**
 * Creates a mock computed value for React hook usage
 * @param fn - The computation function
 * @returns The computed value
 */
export const useComputed = <T>(fn: () => T): T => fn();

/**
 * Creates a mock effect
 */
export const effect: jest.Mock = jest.fn();

/**
 * Creates a mock batch operation
 * @param fn - The function to execute in batch
 */
export const batch = (fn: () => void): void => fn();
