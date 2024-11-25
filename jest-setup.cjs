require('@testing-library/jest-dom');

// Custom matcher for range checking
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Optional: Add a global console error handler to catch and log errors
const originalConsoleError = console.error;
console.error = (message, ...optionalParams) => {
  originalConsoleError(message, ...optionalParams);
};
