import { test, expect, type Request } from '@playwright/test';
import { TerminalPage } from '../page-objects/TerminalPage';

test.describe('edit command with AWS integration', () => {
    let terminal: TerminalPage;

    test.beforeEach(async ({ page }) => {
        terminal = new TerminalPage(page);
        await terminal.goto();
        await terminal.waitForPrompt();
    });

    test('should create new _index.md when it does not exist', async ({ page }) => {
        // Mock 404 for initial getFile, then 200 for putFile
        await page.route('**/getFile**', async (route) => {
            await route.fulfill({
                status: 404,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: 'File not found'
                })
            });
        });

        await page.route('**/putFile**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    message: 'File saved successfully'
                })
            });
        });

        // Execute edit command without specifying a file (should default to _index.md)
        await terminal.executeCommand('edit');

        // Wait for editor to be fully loaded
        await page.waitForSelector('.monaco-editor', { state: 'visible' });
        await page.waitForSelector('.monaco-editor .view-lines', { state: 'visible' });

        // Editor should be empty since it's a new file
        const editorContent = await page.locator('.monaco-editor').textContent();
        expect(editorContent?.trim()).toBe('');

        // Type new content
        await page.click('.monaco-editor');
        await terminal.typeKeys('# New Index File\n\nThis is a new _index.md file.');

        // Save changes
        await page.keyboard.press('Control+S');

        // Wait for success message
        await terminal.waitForOutput('File saved successfully');

        // Verify API calls
        const putFileRequest = await page.waitForRequest((request: Request) =>
            request.url().includes('putFile')
        );

        const postData = JSON.parse(putFileRequest.postData() || '{}');
        expect(postData).toMatchObject({
            content: '# New Index File\n\nThis is a new _index.md file.'
        });
    });

    test('should edit existing _index.md', async ({ page }) => {
        // Mock successful getFile and putFile responses
        await page.route('**/getFile**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    content: '# Existing Index\n\nThis is the existing content.',
                    encoding: 'utf-8',
                    lastModified: new Date().toISOString(),
                    size: 42
                })
            });
        });

        await page.route('**/putFile**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    message: 'File saved successfully'
                })
            });
        });

        // Execute edit command
        await terminal.executeCommand('edit');

        // Wait for editor to be fully loaded with content
        await page.waitForSelector('.monaco-editor', { state: 'visible' });
        await page.waitForSelector('.monaco-editor .view-lines', { state: 'visible' });
        await expect(page.locator('.monaco-editor')).toContainText('# Existing Index');

        // Update content
        await page.click('.monaco-editor');
        await page.keyboard.press('Control+A'); // Select all
        await page.keyboard.press('Delete'); // Clear content
        await terminal.typeKeys('# Updated Index\n\nThis content has been updated.');

        // Save changes
        await page.keyboard.press('Control+S');

        // Wait for success message
        await terminal.waitForOutput('File saved successfully');

        // Verify API calls
        const putFileRequest = await page.waitForRequest((request: Request) =>
            request.url().includes('putFile')
        );

        const postData = JSON.parse(putFileRequest.postData() || '{}');
        expect(postData).toMatchObject({
            content: '# Updated Index\n\nThis content has been updated.'
        });
    });

    test('should handle server error', async ({ page }) => {
        // Mock server error response
        await page.route('**/getFile**', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: 'Internal server error'
                })
            });
        });

        // Execute edit command
        await terminal.executeCommand('edit');

        // Wait for error message
        await terminal.waitForOutput('Internal server error');
    });
});