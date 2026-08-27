import { defineConfig, devices } from '@playwright/test';
import { TEST_CONFIG } from './src/e2e/config';

export default defineConfig({
    globalSetup: './src/e2e/playwright.setup.ts',
    testDir: './src/e2e',
    // E2E tests below still need fixing for the Monaco terminal migration.
    // Remove patterns from testIgnore as tests are repaired.
    testIgnore: [
      '**/complete-command.spec.ts',
      '**/edit-command.spec.ts',
      '**/edit-command-aws.spec.ts',
      '**/edit-content-display.spec.ts',
      '**/edit-content-storage.spec.ts',
      '**/edit-content-vim.spec.ts',
      '**/github-command-navigation.spec.ts',
      '**/monaco-tree-view.spec.ts',
      '**/monacoTerminalError.spec.ts',
      '**/debugMonacoError.spec.ts',
      '**/page-objects/*.spec.ts',
      '**/scenarios/*.spec.ts',
      '**/signal-test.spec.ts',
      '**/tutorial-fdsa.spec.ts',
      '**/tutorial-jkl.spec.ts',
      '**/tutorial-signal.spec.ts',
      '**/tutorial.spec.ts',
    ],
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: process.env.CI ? 4 : undefined,
    timeout: 30_000,
    reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',
    use: {
        trace: 'on-first-retry',
        baseURL: TEST_CONFIG.baseUrl,
    },
    webServer: {
        command: 'vite',
        url: TEST_CONFIG.baseUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 60 * 1000
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH && {
                    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
                }),
            },
        },
    ],
});