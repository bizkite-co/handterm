import '@testing-library/jest-dom';

// Explicitly import Jest's expect
import { expect } from '@jest/globals';

// Custom matcher type definition
type CustomMatcher = (received: any, floor: number, ceiling: number) => {
  pass: boolean;
  message: () => string;
};

// Create a custom matcher
const toBeWithinRange: CustomMatcher = (received, floor, ceiling) => {
  const pass = received >= floor && received <= ceiling;
  return {
    pass,
    message: pass
      ? () => `expected ${received} not to be within range ${floor} - ${ceiling}`
      : () => `expected ${received} to be within range ${floor} - ${ceiling}`
  };
};

// Extend Jest's expect
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}

// Ensure expect is available and extended
function setupExpectExtensions() {
  // Try multiple ways to access and extend expect
  const expectVariants = [
    expect,
    (global as any).expect,
    (globalThis as any).expect,
    (window as any).expect
  ];

  for (const currentExpect of expectVariants) {
    if (currentExpect && typeof currentExpect.extend === 'function') {
      try {
        currentExpect.extend({
          toBeWithinRange
        });
        console.log('Successfully extended expect');
        break;
      } catch (error) {
        console.warn('Failed to extend expect:', error);
      }
    }
  }
}

// Call setup immediately
setupExpectExtensions();

// Ensure global availability
(global as any).expect = expect;
(globalThis as any).expect = expect;

export {};
