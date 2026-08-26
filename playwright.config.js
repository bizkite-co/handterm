import { defineConfig, devices } from '@playwright/test';
import { TEST_CONFIG } from './src/e2e/config';

export default defineConfig({
    globalSetup: './src/e2e/playwright.setup.ts',
    testDir: './src/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 4 : undefined,
    timeout: 30_000,
    reporter: 'html',
    use: {
        trace: 'on-first-retry',
        baseURL: TEST_CONFIG.baseUrl,
    },
    webServer: {
        command: 'vite',
        url: TEST_CONFIG.baseUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 15 * 1000
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