import { type Page, type Locator } from '@playwright/test';
import { TEST_CONFIG } from '../config';
import { setupBrowserWindow } from '../browser-setup/setupWindow';
import { type IStandaloneCodeEditor, type ActivityType } from '@handterm/types';

declare global {
	interface Window {
		monacoEditor?: IStandaloneCodeEditor;
	}
}

/**
 * Page object for interacting with the Monaco editor in Vim mode.
 * This represents a TUI (Text User Interface) element that only accepts keyboard input.
 * No mouse interactions or button clicks should be used except for initial focus.
 */
export class EditorPage {
	readonly page: Page;
	readonly editor: Locator;
	readonly statusBar: Locator;
	readonly container: Locator;

	constructor(page: Page) {
		this.page = page;
		this.editor = page.locator('.monaco-editor');
		this.statusBar = page.locator('.vim-status-bar');
		this.container = page.locator('.monaco-editor-container');
	}

	async initialize(): Promise<void> {
		// Setup browser window environment first
		await setupBrowserWindow(this.page);

		// Verify editor-specific functions and state
		const verification = await this.page.evaluate(() => ({
			hasMonacoEditor: typeof window.monacoEditor !== 'undefined',
		}));

		if (!verification.hasMonacoEditor) {
			throw new Error('Monaco editor not properly initialized');
		}

		await this.waitForEditor();
	}

	async waitForEditor(): Promise<void> {
		const startTime = Date.now();
		try {
			// Wait for editor container to be attached
			await this.container.waitFor({
				state: 'attached',
				timeout: TEST_CONFIG.timeout.long
			});
			console.log(`[waitForEditor] Container attached in ${Date.now() - startTime}ms (timeout: ${TEST_CONFIG.timeout.long}ms)`);

			// Wait for editor container to be visible
			await this.container.waitFor({
				state: 'visible',
				timeout: TEST_CONFIG.timeout.long
			});
			console.log(`[waitForEditor] Container visible in ${Date.now() - startTime}ms (timeout: ${TEST_CONFIG.timeout.long}ms)`);


			// Wait for Monaco initialization
			await this.page.waitForFunction(() => window.monacoEditor !== undefined, {
				timeout: TEST_CONFIG.timeout.medium
			});
			console.log(`[waitForEditor] Monaco initialized in ${Date.now() - startTime}ms (timeout: ${TEST_CONFIG.timeout.medium}ms)`);

			// Wait for Vim mode initialization
			await this.statusBar.waitFor({
				state: 'visible',
				timeout: TEST_CONFIG.timeout.medium
			});
			console.log(`[waitForEditor] Vim status bar visible in ${Date.now() - startTime}ms (timeout: ${TEST_CONFIG.timeout.medium}ms)`);

			console.log(`[waitForEditor] Completed in ${Date.now() - startTime}ms`);
		} catch (error) {
			const duration = Date.now() - startTime;
			console.error(`[waitForEditor] Timed out after ${duration}ms`);
			throw error;
		}
	}

	async pressKey(key: string): Promise<void> {
		await this.page.keyboard.press(key);
	}

	async setContent(content: string): Promise<void> {
		await this.page.evaluate((content) => {
			if (window.monacoEditor) {
				window.monacoEditor.setValue(content);
			} else {
				console.error('Monaco editor not initialized when setting content');
			}
		}, content);
	}

	async getContent(): Promise<string> {
		return await this.page.evaluate(() => {
			return window.monacoEditor?.getValue() || '';
		});
	}

	async focus(): Promise<void> {
		await this.editor.click();
		await this.page.keyboard.press('Escape');
		await this.ensureMode('NORMAL');
	}

	async ensureMode(expectedMode: string): Promise<void> {
		const startTime = Date.now();
		try {
			await this.page.waitForFunction(
				([mode, statusBar]) => {
					const status = document.querySelector(statusBar ?? '');
					return (status?.textContent ?? '').includes(mode ?? ''); // Nullish coalescing operator here
				},
				[expectedMode, '.vim-status-bar'],
				{ timeout: TEST_CONFIG.timeout.short },
			);
			const duration = Date.now() - startTime;
			console.log(`[ensureMode] Mode "${expectedMode}" confirmed in ${duration}ms (timeout: ${TEST_CONFIG.timeout.short}ms)`);
		} catch (error) {
			const duration = Date.now() - startTime;
			console.error(`[ensureMode] Timed out waiting for mode "${expectedMode}" after ${duration}ms (timeout: ${TEST_CONFIG.timeout.short}ms)`);
			throw error;
		}
	}

	async getVimMode(): Promise<string> {
		const statusText = await this.statusBar.textContent() ?? ''; // Nullish coalescing operator here
		return statusText;
	}

	async getCursorPosition(): Promise<{ lineNumber: number; column: number }> {
		return await this.page.evaluate(() => {
			const editor = window.monacoEditor;
			if (!editor) {
				console.error('Monaco editor not initialized when getting cursor position');
				return { lineNumber: 0, column: 0 };
			}
			const position = editor.getPosition();
			if (!position) {
				console.error('Monaco editor position is null when getting cursor position');
				return { lineNumber: 0, column: 0 };
			}
			console.log('Cursor position:', position); // Add logging
			return position;
		});
	}

	async sendKeys(keys: string): Promise<void> {
		for (const key of keys) {
			await this.page.keyboard.press(key);
			// Small delay to ensure key is processed
			await this.page.waitForTimeout(50);
		}
	}

	async isInEditMode(): Promise<boolean> {
		return this.page.url().includes('?activity=edit');
	}

	async getCurrentLineContent(): Promise<string> {
		return await this.page.evaluate(() => {
			const editor = window.monacoEditor;
			if (!editor) {
				return ''; // Or throw an error, depending on desired behavior
			}
			const position = editor.getPosition();
			if (!position) {
				return ''; // Or throw an error
			}
			return editor.getModel()?.getLineContent(position.lineNumber) ?? '';
		});
	}
}
