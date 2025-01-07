export const TEST_CONFIG = {
  baseUrl: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
  timeout: {
    short: 500,
    medium: 1000,
    long: 2000,
    transition: 5000
  }
};
