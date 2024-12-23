// Type guard for non-empty strings
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isNullOrEmptyString(value: unknown): value is null | undefined | '' {
  return value === null || value === undefined || value === '';
}

// Safe value retrieval with default
export function getValidatedValue<T>(
  value: T | null | undefined,
  defaultValue: T
): T {
  return value ?? defaultValue;
}

// Safe property access with default
export function safelyAccessProperty<T, K extends keyof T>(
  obj: T | null | undefined,
  property: K,
  defaultValue: T[K]
): T[K] {
  return obj?.[property] ?? defaultValue;
}

export function safelyCallMethodOnRef<T, K extends keyof T>(
    ref: React.RefObject<T>,
    methodName: K,
    ...args: T[K] extends (...args: infer P) => unknown ? P : never[]
): void {
    const method = ref.current?.[methodName];
    if (method !== null && method !== undefined && typeof method === 'function') {
        const typedMethod = method as T[K] extends (...args: infer P) => unknown ? (...args: P) => unknown : never;
        typedMethod(...args);
    }
}

export function createSafeCaller<T>(ref: React.RefObject<T>) {
  return function <K extends keyof T>(
    methodName: K,
    ...args: T[K] extends (...args: infer P) => unknown ? P : never[]
  ): void {
    if (ref.current !== null && ref.current !== undefined && typeof ref.current[methodName] === 'function') {
      const method = ref.current[methodName] as T[K] extends (
        ...args: infer P
      ) => unknown
        ? (...args: P) => void
        : never;
      method(...args);
    }
  };
}
