// Playwright-specific setup without Vitest dependencies
import { chromium, type FullConfig } from '@playwright/test';
import { exposeSignals } from '../test-utils/exposeSignals';
import { TEST_CONFIG } from './config';
import { assert } from 'console';

async function globalSetup(_config: FullConfig): Promise<void> {
  const launchOptions: { executablePath?: string } = {};
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage();

  // Add console listener for debugging
  page.on('console', msg => {
    console.log(`Setup log: ${msg.text()}`);
  });

  // Expose signals before any tests run
  await page.addInitScript(`
    ${exposeSignals.toString()};
    (() => {
      console.log('Exposing signals...');
      exposeSignals();
    })();
  `);

  await browser.close();
}

export default globalSetup;
