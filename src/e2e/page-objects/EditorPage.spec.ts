import { test, expect, type Page } from '@playwright/test';
import { TerminalPage } from './TerminalPage';
import { EditorPage } from './EditorPage';
import { TEST_CONFIG } from '../config';
import { ActivityType } from '@handterm/types';

test.describe('EditorPage', () => {
	let page: Page;
	let terminal: TerminalPage;
	let editor: EditorPage;

	test.beforeEach(async ({ browser }) => {
		page = await browser.newPage();
		await page.goto(TEST_CONFIG.baseUrl);
		await page.waitForLoadState('domcontentloaded');

		// Initialize page objects
		terminal = new TerminalPage(page);
		editor = new EditorPage(page);

		// Initialize terminal
		await terminal.initialize();
		await terminal.waitForPrompt();

		// Complete tutorials
		await terminal.completeTutorials();
		await editor.initialize();
	});

	test('initializes with correct state', async () => {
		// Verify editor is visible
		await expect(editor.editor).toBeVisible();
		await expect(editor.statusBar).toBeVisible();

		// Verify we're in edit mode
		const isInEditMode = await editor.isInEditMode();
		expect(isInEditMode).toBe(true);
	});

	test('can set and get content', async () => {
		await editor.initialize();
		const testContent = '# Test Content\nThis is a test.';
		await editor.setContent(testContent);

		const content = await editor.getContent();
		expect(content).toBe(testContent);
	});

	test('cursor movement works', async () => {
		await editor.initialize();
		// Set some test content
		const testContent = 'Line 1\nLine 2\nLine 3';
		await editor.setContent(testContent);
		await editor.focus();

		// Move cursor using vim commands
		await editor.sendKeys('j'); // move down one line

		const position = await editor.getCursorPosition();
		expect(position.lineNumber).toBe(2);
	});

	test('vim mode transitions work', async () => {
		await editor.initialize();
		await editor.focus();

		// Should start in normal mode
		await editor.ensureMode('NORMAL');

		// Switch to insert mode
		await editor.sendKeys('i');
		await editor.ensureMode('INSERT');

		// Back to normal mode
		await page.keyboard.press('Escape');
		await editor.ensureMode('NORMAL');
	});

	test('handles :wq command', async () => {
		await editor.initialize();
		await editor.focus();

		// Enter command mode and type :wq
		await editor.sendKeys(':');
		await editor.sendKeys('wq');
		await editor.sendKeys('Enter');

		// Should transition back to normal terminal mode
		await page.waitForFunction(
			() => window.activityStateSignal?.value?.current !== ActivityType.EDIT,
			{ timeout: TEST_CONFIG.timeout.long },
		);

		// Verify terminal is active
		// await terminal.waitForPrompt();
	});

	test.afterEach(async () => {
		await page.close();
	});
});
