// @ts-nocheck
import { test, expect } from '@playwright/test';
import {
    setCompletedTutorial,
    tutorialSignal
} from 'src/signals/tutorialSignals';
import { TEST_CONFIG } from '../config';

test.describe('should complete jkl; tutorial', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle' });
        // Clear any existing tutorial progress
        await page.evaluate(() => {
            localStorage.removeItem('completed-tutorials');
        });
    });

    test('should complete jkl; tutorial', async ({ page }) => {
        // Set the initial tutorial
        await page.evaluate(() => {
            window.tutorialSignal.value = {
                key: 'jkl;',
                value: 'jkl;',
                displayAs: 'Tutorial',
            };
        });

        // Wait for the tutorial component to be visible
        await page.waitForSelector('.tutorial-component', { state: 'visible', timeout: TEST_CONFIG.timeout.transition });

        // Type 'j'
        await page.keyboard.type('j');
        await page.waitForTimeout(500);

        // Type 'k'
        await page.keyboard.type('k');
        await page.waitForTimeout(500);

        // Type 'l'
        await page.keyboard.type('l');
        await page.waitForTimeout(500);

        // Type ';'
        await page.keyboard.type(';');
        await page.waitForTimeout(500);


        // Check if the tutorial is marked as complete
        const completedTutorials = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('completed-tutorials') || '[]');
        });

        expect(completedTutorials).toContain('jkl;');
    },
        {
            timeout: TEST_CONFIG.timeout.long
        });
});