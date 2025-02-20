import { test, expect } from '@playwright/test';
import { TerminalPage } from './TerminalPage';
import { EditorPage } from './EditorPage';
import { TEST_CONFIG } from '../config';
import { initializeActivitySignal } from '../helpers/initializeSignals';

test.describe('EditorPage', () => {
	let terminal: TerminalPage;
	let editor: EditorPage;

	test.beforeEach(async ({ page }) => {
		// First navigate to the page
		await page.goto(TEST_CONFIG.baseUrl);
		await page.waitForLoadState('domcontentloaded');

		// Initialize signals
		await initializeActivitySignal(page);

		// Initialize terminal page object
		terminal = new TerminalPage(page);

		// Wait for the application to be ready and verify signal state
		await page.waitForSelector('#handterm-wrapper', {
			state: 'attached',
			timeout: TEST_CONFIG.timeout.long
		});

		// Complete tutorials once at the beginning
		await terminal.completeTutorials();
		await terminal.waitForPrompt();

		await terminal.executeCommand('edit');

		editor = new EditorPage(page);
		await editor.waitForEditor();
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
		const testContent = '# Test Content\nThis is a test.';
		await editor.setContent(testContent);

		const content = await editor.getContent();
		expect(content).toBe(testContent);
	});

	test('cursor movement works', async () => {
		// Set some test content
		const testContent = 'Line 1\nLine 2\nLine 3';
		await editor.setContent(testContent);
		await editor.focus();

		// Move cursor using vim commands
		await editor.sendKeys('j'); // move down one line

		const position = await editor.getCursorPosition();
		expect(position.lineNumber).toBe(2);
	});

	test('vim mode transitions work', async () => {  // Added ({ page })
		await editor.focus();

		// Should start in normal mode
		await editor.ensureMode('NORMAL');

		// Switch to insert mode
		await editor.sendKeys('i');
		await editor.ensureMode('INSERT');

		// Back to normal mode
		await editor.pressKey('Escape');
		await editor.ensureMode('NORMAL');
	});

	test('handles :wq command', async () => {
		await editor.focus();

		// Enter command mode and type :wq
		await editor.sendKeys(':');
		await editor.sendKeys('wq');
		await editor.sendKeys('Enter');

		// Should transition back to normal terminal mode and verify terminal is active
		await terminal.waitForPrompt();
	});

	test.afterEach(async ({ page }) => {
		await page.close();
	});
});
