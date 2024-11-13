// Import jest-dom first
import '@testing-library/jest-dom';

// Import Jest's expect
import { expect } from '@jest/globals';

// Import jest-dom matchers
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Jest with testing library matchers
expect.extend(matchers as any);

// Optional: Add a global console error handler to catch and log errors
const originalConsoleError = console.error;
console.error = (message, ...optionalParams) => {
  originalConsoleError(message, ...optionalParams);
};
