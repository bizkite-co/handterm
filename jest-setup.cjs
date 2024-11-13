require('@testing-library/jest-dom');

// Optional: Add a global console error handler to catch and log errors
const originalConsoleError = console.error;
console.error = (message, ...optionalParams) => {
  originalConsoleError(message, ...optionalParams);
};
