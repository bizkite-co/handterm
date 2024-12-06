import { expect, vi } from 'vitest';
import '@testing-library/jest-dom';

// Explicitly remove all Jest-specific global configurations
if (typeof global !== 'undefined') {
  // Remove Jest-specific properties
  delete (global as any).jest;
  delete (global as any).expect;
  delete (global as any).test;
  delete (global as any).describe;
  delete (global as any).it;
}

// Ensure global expect is set to Vitest's expect
(global as any).expect = expect;

// Custom matcher
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: pass
        ? () => `expected ${received} not to be within range ${floor} - ${ceiling}`
        : () => `expected ${received} to be within range ${floor} - ${ceiling}`
    };
  }
});

// Ensure global testing functions are available
(global as any).describe = vi.fn();
(global as any).it = vi.fn();
(global as any).test = vi.fn();

export {};
