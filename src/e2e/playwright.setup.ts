// Playwright-specific setup without Vitest dependencies
import { chromium, type FullConfig } from '@playwright/test';
import { exposeSignals } from '../test-utils/exposeSignals';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { TEST_CONFIG } from '../e2e/config';

async function globalSetup(_config: FullConfig): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Expose required signals to window object
  // Expose signals before any navigation
  const exposeSignalsString = exposeSignals.toString();
  await page.addInitScript(`
    window.exposeSignals = ${exposeSignalsString};
    window.exposeSignals();
  `);

  // Add performance timing
  const startTime = Date.now();

  // Initialize localStorage state with element checks
  console.log('Navigating to base URL:', TEST_CONFIG.baseUrl);
  await page.goto(TEST_CONFIG.baseUrl, {
    waitUntil: 'domcontentloaded',
    timeout: TEST_CONFIG.timeout.long
  });

  // Check if root element is present
  const rootElement = await page.$('#root');
  if (!rootElement) {
    throw new Error('Root element not found after page load');
  }
  console.log('Root element loaded in', Date.now() - startTime, 'ms');

  // Check if terminal container is present
  const terminalContainer = await page.$('#xtermRef');
  if (!terminalContainer) {
    throw new Error('Terminal container not found after page load');
  }
  console.log('Terminal container loaded in', Date.now() - startTime, 'ms');

  // Verify signals are properly exposed with detailed logging
  console.log('Verifying window signals...');
  const signalsPresent = await page.waitForFunction(() => {
    try {
      const windowKeys = Object.keys(window);
      console.log('Current window properties:', windowKeys);

      const hasCommandLine = 'commandLineSignal' in window;
      const hasActivity = 'activitySignal' in window;
      const hasTutorial = 'tutorialSignals' in window;

      if (!hasCommandLine) {
        console.warn('Missing commandLineSignal');
      }
      if (!hasActivity) {
        console.warn('Missing activitySignal');
      }
      if (!hasTutorial) {
        console.warn('Missing tutorialSignals');
      }

      return hasCommandLine && hasActivity && hasTutorial;
    } catch (error) {
      console.error('Error checking window properties:', error);
      return false;
    }
  }, {
    timeout: TEST_CONFIG.timeout.long,
    polling: 500
  });

  if (!signalsPresent) {
    throw new Error('Failed to expose required window signals');
  }
  console.log('Window signals verified in', Date.now() - startTime, 'ms');

  // Store auth state if needed
  await page.context().storageState({ path: 'playwright/.auth/user.json' });

  await browser.close();
}

export default globalSetup;
