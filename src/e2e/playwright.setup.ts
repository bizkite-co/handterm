// Playwright-specific setup without Vitest dependencies
import { chromium, type FullConfig } from '@playwright/test';
import { exposeSignals } from '../test-utils/exposeSignals';
import { TEST_CONFIG } from './config';

async function globalSetup(_config: FullConfig): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Add console listener for debugging
  page.on('console', msg => {
    console.log(`Setup log: ${msg.text()}`);
  });

  // Expose signals before navigation
  await page.addInitScript(`
    ${exposeSignals.toString()};
    (() => {
      console.log('Exposing signals...');
      exposeSignals();
      console.log('Signals exposed:', {
        hasActivityState: !!window.activityStateSignal,
        initialState: window.activityStateSignal?.value
      });
    })();
  `);

  await page.goto(TEST_CONFIG.baseUrl);

  // Verify signals after navigation
  const signalsPresent = await page.evaluate(() => {
    return {
      hasActivityState: !!window.activityStateSignal,
      state: window.activityStateSignal?.value
    };
  });

  console.log('Signals verification:', signalsPresent);

  await browser.close();
}

export default globalSetup;
