import { type Page, type Locator } from '@playwright/test';
import { TEST_CONFIG } from '../config';
import { setupBrowserWindow } from '../browser-setup/setupWindow';
import { type IStandaloneCodeEditor, type ActivityType } from '@handterm/types';

declare global {
	interface Window {
		monacoEditor?: IStandaloneCodeEditor;
		activityStateSignal: {
			value: {
				current: ActivityType;
				previous: ActivityType | null;
				transitionInProgress: boolean;
				tutorialCompleted: boolean;
			};
		};
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
			hasActivitySignal: !!window.activityStateSignal,
			currentActivity: window.activityStateSignal?.value?.current,
		}));

		if (!verification.hasMonacoEditor) {
			throw new Error('Monaco editor not properly initialized');
		}
		if (!verification.hasActivitySignal) {
			throw new Error('Activity signal not properly initialized');
		}

    // Wait for the activity state to change to 'edit'
    await this.page.waitForFunction(() => window.activityStateSignal?.value?.current === 'edit');

		await this.waitForEditor();
	}

	async waitForEditor(): Promise<void> {
		// Wait for editor container
		await this.container.waitFor({
			state: 'visible',
			timeout: TEST_CONFIG.timeout.long
		});

		// Wait for Monaco initialization
		await this.page.waitForFunction(() => window.monacoEditor !== undefined, {
			timeout: TEST_CONFIG.timeout.medium
		});

		// Wait for Vim mode initialization
		await this.statusBar.waitFor({
			state: 'visible',
			timeout: TEST_CONFIG.timeout.medium
		});
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
    await this.page.waitForFunction(
      ([mode, statusBar]) => {
        const status = document.querySelector(statusBar ?? '');
        return (status?.textContent ?? '').includes(mode ?? ''); // Nullish coalescing operator here
      },
      [expectedMode, '.vim-status-bar'],
      { timeout: TEST_CONFIG.timeout.short },
    );
  }

  async getVimMode(): Promise<string> {
    const statusText = await this.statusBar.textContent() ?? ''; // Nullish coalescing operator here
    return statusText;
  }

	async getCursorPosition(): Promise<{ lineNumber: number; column: number }> {
		return await this.page.evaluate(() => {
      const position = window.monacoEditor?.getPosition() || { lineNumber: 0, column: 0 };
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
