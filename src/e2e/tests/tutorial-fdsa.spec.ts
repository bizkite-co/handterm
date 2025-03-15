// @ts-nocheck
import { test, expect } from '@playwright/test';
import {
    setCompletedTutorial,
    tutorialSignal
} from 'src/signals/tutorialSignals';
import { TEST_CONFIG } from '../config';

test.describe('should complete fdsa tutorial', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle' });
        // Clear any existing tutorial progress
        await page.evaluate(() => {
            localStorage.removeItem('completed-tutorials');
        });
    });

    test('should complete fdsa tutorial', async ({ page }) => {
        // Set the initial tutorial
        await page.evaluate(() => {
            window.tutorialSignal.value = {
                key: 'fdsa',
                value: 'fdsa',
                displayAs: 'Tutorial',
            };
        });

        // Wait for the tutorial component to be visible
        await page.waitForSelector('.tutorial-component', { state: 'visible', timeout: TEST_CONFIG.timeout.transition });

        // Type 'f'
        await page.keyboard.type('f');
        await page.waitForTimeout(500);

        // Type 'd'
        await page.keyboard.type('d');
        await page.waitForTimeout(500);

        // Type 's'
        await page.keyboard.type('s');
        await page.waitForTimeout(500);

        // Type 'a'
        await page.keyboard.type('a');
        await page.waitForTimeout(500);

        // Check if the tutorial is marked as complete
        const completedTutorials = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('completed-tutorials') || '[]');
        });

        expect(completedTutorials).toContain('fdsa');
    },
        {
            timeout: TEST_CONFIG.timeout.long
        });
});