// Playwright-specific setup without Vitest dependencies
import { chromium, type FullConfig } from '@playwright/test';
import { exposeSignals } from '../test-utils/exposeSignals';
import type { WindowExtensions } from '@handterm/types';
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
    waitUntil: 'networkidle',
    timeout: TEST_CONFIG.timeout.long
  });

  // Check if root element is present
  const rootElement = await page.$('#root');
  if (!rootElement) {
    throw new Error('Root element not found after page load');
  }
  console.log('Root element loaded in', Date.now() - startTime, 'ms');

  // Check if terminal container is present with retries and debugging
  let terminalContainer = null;
  let retries = 5;
  while (retries > 0 && !terminalContainer) {
    terminalContainer = await page.$('#xtermRef');
    if (!terminalContainer) {
      retries--;
      await page.waitForTimeout(2000);

      // Debugging: Log page HTML if terminal not found
      if (retries === 2) {
        const html = await page.content();
        console.log('Page HTML:', html);
      }
    }
  }

  if (!terminalContainer) {
    // Debugging: Take screenshot before failing
    await page.screenshot({ path: 'playwright/setup-error.png' });
    throw new Error('Terminal container not found after page load');
  }
  console.log('Terminal container loaded in', Date.now() - startTime, 'ms');

  // Verify DOM hierarchy first
  console.log('Checking DOM parent chain...');
  await page.waitForSelector('body');
  await page.waitForSelector('#handterm-wrapper');
  await page.waitForSelector('#prompt-and-terminal');

  // Verify signals with enhanced diagnostics
  // Check for specific signal properties with retries
  const requiredSignals = ['activitySignal', 'commandLineSignal', 'tutorialSignals'];
  console.log('Checking for required window signals:', requiredSignals);

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const signalStatus = await page.evaluate((signals: string[]) => {
      return signals.map(signal => {
        // Use project's official WindowExtensions type with proper Signal typing
        const win = window as unknown as Window & WindowExtensions;
        const value = signal === 'activitySignal' ? win.activitySignal :
                      signal === 'commandLineSignal' ? win.commandLineSignal :
                      win.tutorialSignals;
        return {
          name: signal,
          exists: signal in win,
          type: value?.constructor?.name ?? 'undefined'
        };
      });
    }, requiredSignals);

    console.log(`Signal check attempt ${attempts + 1}:`, signalStatus);

    if (signalStatus.every(s => s.exists)) {
      break;
    }

    attempts++;
    await page.waitForTimeout(1000 * attempts);
  }

  console.log('Verifying window signals...');
  const signalsPresent = await page.waitForFunction(() => {
    try {
      // Check only for the signals we care about
      const signalCheck = {
        activitySignal: {
          exists: 'activitySignal' in window,
          type: typeof window.activitySignal?.constructor?.name
        },
        commandLineSignal: {
          exists: 'commandLineSignal' in window,
          type: typeof window.commandLineSignal?.constructor?.name
        },
        tutorialSignals: {
          exists: 'tutorialSignals' in window,
          type: typeof window.tutorialSignals?.constructor?.name
        }
      };
      console.log('Signal status:', signalCheck);

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
