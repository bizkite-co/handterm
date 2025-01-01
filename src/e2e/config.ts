export const TEST_CONFIG = {
  baseUrl: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
  timeout: {
    short: 5000,
    medium: 10000,
    long: 20000
  }
};
