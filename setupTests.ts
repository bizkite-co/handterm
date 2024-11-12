// Import core testing libraries
import '@testing-library/jest-dom';

// Explicitly import Jest globals
import {
  expect as jestExpect,
  jest,
  describe,
  it,
  beforeEach,
  afterEach
} from '@jest/globals';

// Import specific matchers
import { toBeInTheDocument } from '@testing-library/jest-dom/matchers';

// Extend Jest with testing library matchers
jestExpect.extend({
  toBeInTheDocument
});

// Extend global object with testing functions
// Use type assertion to bypass TypeScript strict checks
(globalThis as any).expect = jestExpect;
(globalThis as any).jest = jest;
(globalThis as any).describe = describe;
(globalThis as any).it = it;
(globalThis as any).beforeEach = beforeEach;
(globalThis as any).afterEach = afterEach;

// Optional: Add a global console error handler to catch and log errors
const originalConsoleError = console.error;
console.error = (message, ...optionalParams) => {
  originalConsoleError(message, ...optionalParams);
};
