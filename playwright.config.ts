import { defineConfig, devices } from '@playwright/test';
import { TEST_CONFIG } from './src/e2e/config';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: (process.env.CI ?? '') !== '',
  /* Retry on CI only */
  retries: (process.env.CI ?? '') !== '' ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: (process.env.CI ?? '') !== '' ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'list',
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
      /* Force headless mode */
      headless: true,
      /* Base URL to use in actions like `await page.goto('/')`. */
      baseURL: TEST_CONFIG.baseUrl,


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
              }
            ]
          }
        ]
      } as const,
      permissions: ['clipboard-read', 'clipboard-write'],

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry'
  },

  /* Configure web server to run before tests */
  webServer: {
    command: 'npm run dev',
    url: TEST_CONFIG.baseUrl,
    reuseExistingServer: (process.env.CI ?? '') === '',
    timeout: 30 * 1000, // 30 seconds for dev server to start
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
        // Use default storage state
      },
    },

    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     contextOptions: {
    //       storageState: undefined
    //     }
    //   },
    // },

    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     contextOptions: {
    //       storageState: undefined
    //     }
    //   },
    // },
  ],
});
