// This file is kept for reference during the transition to AWS storage.
// TODO: Remove this file once the AWS integration is fully tested and deployed.

import { test, expect, type Page } from '@playwright/test';
import { TEST_CONFIG } from '../config';

test.describe.skip('Legacy Edit Content Storage', () => {
    let page: Page;

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();
        await page.goto(TEST_CONFIG.baseUrl);
    });

    test('can store and retrieve edit content in localStorage', async () => {
        const testContent = {
            key: '_index.md',
            content: '# Test Content'
        };

        const result = await page.evaluate((content) => {
            // Store content
            localStorage.setItem('edit-content', JSON.stringify(content));

            // Retrieve content
            const stored = localStorage.getItem('edit-content');
            return stored ? JSON.parse(stored) : null;
        }, testContent);

        expect(result).toEqual(testContent);
    });

    test('edit content persists between evaluate calls', async () => {
        const testContent = {
            key: 'test.md',
            content: '## Persistent Content'
        };

        // First call: store the content
        await page.evaluate((content) => {
            localStorage.setItem('edit-content', JSON.stringify(content));
        }, testContent);

        // Second call: retrieve the content
        const result = await page.evaluate(() => {
            const stored = localStorage.getItem('edit-content');
            return stored ? JSON.parse(stored) : null;
        });

        expect(result).toEqual(testContent);
    });

    test('can update existing edit content', async () => {
        // Store initial content
        await page.evaluate(() => {
            localStorage.setItem('edit-content', JSON.stringify({
                key: 'update.md',
                content: 'Initial content'
            }));
        });

        // Update content
        const updatedContent = {
            key: 'update.md',
            content: 'Updated content'
        };

        await page.evaluate((content) => {
            localStorage.setItem('edit-content', JSON.stringify(content));
        }, updatedContent);

        // Verify update
        const result = await page.evaluate(() => {
            const stored = localStorage.getItem('edit-content');
            return stored ? JSON.parse(stored) : null;
        });

        expect(result).toEqual(updatedContent);
    });

    test.afterEach(async () => {
        await page.close();
    });
});