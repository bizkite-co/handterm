export const TEST_CONFIG = {
  baseUrl: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
  timeout: {
    short: 2000,       // 2 seconds for quick operations
    medium: 3000,     // 10 seconds for typical operations
    long: 6000,       // 30 seconds for page loads
    transition: 12000   // 5 seconds for UI transitions
  }
};
