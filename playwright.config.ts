import { defineConfig, devices } from '@playwright/test';

// Separate Playwright-specific setup from Vitest
export const PLAYWRIGHT_SETUP = './src/e2e/global.setup.ts';
import type { Expect } from '@playwright/test';
import { TEST_CONFIG } from './src/e2e/config';

// Extend global type declarations
declare global {
  interface Window {
    expect: Expect;
    exposeSignals: () => void;
    signals: Record<string, unknown>;
  }
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // Run setup file before all tests
  globalSetup: PLAYWRIGHT_SETUP,
  testDir: './src/e2e',
  testIgnore: [
    '**/__tests__/**', // Exclude Vitest tests
    '**/*.test.ts' // Exclude .test files
  ],
  timeout: 30 * 1000, // Global timeout of 30 seconds
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: (process.env.CI ?? '') !== '',
  /* Retry on CI only */
  retries: (process.env.CI ?? '') !== '' ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: (process.env.CI ?? '') !== '' ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['list'], ['html', { open: 'never' }]],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Force headless mode */
    headless: true,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: TEST_CONFIG.baseUrl,
    // Capture screenshot on failure
    screenshot: 'only-on-failure',
    // Capture video on failure
    video: 'retain-on-failure',
    // Capture trace on failure
    trace: 'retain-on-failure',

    /* Initialize localStorage for tests */
    storageState: {
      cookies: [],
      origins: [
        {
          origin: TEST_CONFIG.baseUrl,
          localStorage: [
            {
              name: 'github_tree_items',
              value: JSON.stringify([
                {
                  path: 'test-file.txt',
                  type: 'file',
                  content: 'test content'
                }
              ])
            },
            {
              name: 'tutorialSignals',
              value: JSON.stringify({
                isCompleted: false,
                currentTutorial: 'tutorial',
                currentStep: 0
              })
            },
            {
              name: 'activitySignal',
              value: JSON.stringify({
                value: 'NORMAL',
                tutorialState: {
                  isTutorialComplete: false
                }
              })
            }
          ]
        }
      ]
    } as const,
    permissions: ['clipboard-read', 'clipboard-write']
  },

  /* Configure web server to run before tests */
  webServer: {
    command: 'npm run dev',
    url: TEST_CONFIG.baseUrl,
    reuseExistingServer: (process.env.CI ?? '') === '',
    timeout: 15 * 1000 // 15 seconds for dev server to start
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: !(process.env.DEBUG_PW ?? ''),
      },
    },
  ],
});
