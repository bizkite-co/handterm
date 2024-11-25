import '@testing-library/jest-dom';
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
expect.extend({ toBeWithinRange });

export {};
