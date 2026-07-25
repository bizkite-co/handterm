import { chromium, type FullConfig } from '@playwright/test';
import { TEST_CONFIG } from './config';

/**
 * Global setup for Playwright tests
 *
 * Note: Each test is responsible for setting up its own state.
 * This keeps tests independent and easier to understand.
 *
 * For example:
 * - Use localStorage to set up initial state
 * - Use URL parameters to start in a specific mode
 * - Test one state transition at a time
 */
async function globalSetup(_config: FullConfig): Promise<void> {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium-browser';
  const browser = await chromium.launch({ executablePath });
  const page = await browser.newPage();
  await page.goto(TEST_CONFIG.baseUrl);
  await browser.close();
}

export default globalSetup;