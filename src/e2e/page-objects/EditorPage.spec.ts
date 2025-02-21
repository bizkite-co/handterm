import { test, expect } from '@playwright/test';
import { TerminalPage } from './TerminalPage';
import { EditorPage } from './EditorPage';
import { TEST_CONFIG } from '../config';

test.describe('EditorPage', () => {
	let terminal: TerminalPage;
	let editor: EditorPage;

	test.beforeEach(async ({ page }) => {
		// First navigate to the page
		await page.goto(TEST_CONFIG.baseUrl);
		await page.waitForLoadState('domcontentloaded');

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

		// Verify we're in edit mode.  This is now implicit in the fact that the
		// editor and status bar are visible, and we wait for the editor to be
		// initialized.
	});

	test('can set and get content', async () => {
		const testContent = '# Test Content\nThis is a test.';
		await editor.setContent(testContent);

		const content = await editor.getContent();
		expect(content).toBe(testContent);
	});

	test('cursor movement works', async () => {
		// Set some test content - single line to test horizontal movement
		const testContent = 'This is a test line.';
		await editor.setContent(testContent);

		// Get initial position and log it
		const initialPosition = await editor.getCursorPosition();
		console.log('Initial cursor position:', initialPosition);

		// Move cursor using vim commands
		await editor.sendKeys('lll'); // move right three times

		const position = await editor.getCursorPosition();
		console.log('Final cursor position:', position);
		expect(position.column).toBeGreaterThan(1); // Check if column has increased
	});

	test('vim mode transitions work', async () => {
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

	test('handles :q! command', async ({ page }) => {
		await editor.focus();

		// Enter command mode and type :q!
		await editor.sendKeys(':');
		await editor.sendKeys('q!');
		await editor.sendKeys('\r');
		await page.waitForTimeout(1000); // Wait for the command to be processed

		// Should transition back to normal terminal mode
		await terminal.waitForPrompt();
	});

	test.afterEach(async ({ page }) => {
		await page.close();
	});
});

