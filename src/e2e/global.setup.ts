import { chromium, type FullConfig } from '@playwright/test';
import { TEST_CONFIG } from './config';
import { isWindowDefined, ActivityType } from '@handterm/types';

type SimpleSignal<T> = {
  value: T;
  set: (value: T) => void;
};

type SimpleTutorialSignals = {
  currentStep: SimpleSignal<number>;
  totalSteps: SimpleSignal<number>;
  isCompleted: SimpleSignal<boolean>;
};

async function globalSetup(_config: FullConfig): Promise<void> {
  // Ensure signals are initialized before any tests run
  if (isWindowDefined()) {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto(TEST_CONFIG.baseUrl);

    // Expose signals and initialize test environment
    await page.evaluate(() => {
      if (!window.signals) {
        window.signals = {} as any; // Use a generic type to bypass type checking
        window.signals.activity = {
          value: ActivityType.NORMAL,
          set: () => {},
          subscribe: () => {}
        };
        window.signals.tutorial = {
          currentStep: {
            value: 0,
            set: () => {}
          },
          totalSteps: {
            value: 0,
            set: () => {}
          },
          isCompleted: {
            value: false,
            set: () => {}
          }
        };
        window.signals.commandLine = {
          value: '',
          set: () => {},
          subscribe: () => {}
        };
      }
      window.initializeTestEnvironment();
    });

    await browser.close();
  }
}

export default globalSetup;