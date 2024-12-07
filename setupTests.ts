// Import Vitest's expect
import { expect } from 'vitest';

// Import testing-library matchers
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest with testing library matchers
expect.extend(matchers);

// Optional: Add a global console error handler to catch and log errors
const originalConsoleError = console.error;
console.error = (message, ...optionalParams) => {
  originalConsoleError(message, ...optionalParams);
};
