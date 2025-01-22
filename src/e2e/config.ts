export const TEST_CONFIG = {
  baseUrl: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
  timeout: {
    short: 2000,       // 2 seconds for quick operations
    medium: 10000,     // 10 seconds for typical operations
    long: 30000,       // 30 seconds for page loads
    transition: 5000   // 5 seconds for UI transitions
  }
};
