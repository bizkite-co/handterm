import '@testing-library/jest-dom';

// Declare global expect type to avoid TypeScript errors
declare global {
  interface Window {
    expect?: jest.Expect;
  }
  interface Global {
    expect?: jest.Expect;
  }
}

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

// Attempt to extend expect in multiple ways
function extendExpect() {
  // Try global expect
  if (typeof global !== 'undefined' && global.expect && global.expect.extend) {
    global.expect.extend({ toBeWithinRange });
  }

  // Try window expect
  if (typeof window !== 'undefined' && window.expect && window.expect.extend) {
    window.expect.extend({ toBeWithinRange });
  }

  // Try imported expect
  try {
    const jestExpect = require('expect');
    if (jestExpect && jestExpect.extend) {
      jestExpect.extend({ toBeWithinRange });
    }
  } catch (error) {
    console.warn('Could not import expect:', error);
  }
}

// Execute extension
extendExpect();

export {};
