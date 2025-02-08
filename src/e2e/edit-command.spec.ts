import { test, expect } from '@playwright/test';
import { TerminalPage } from './page-objects/TerminalPage';
import type { IStandaloneCodeEditor } from '../types/monaco';
import { StorageKeys } from '@handterm/types';

test.describe('Edit Command', () => {
  let terminal: TerminalPage;

  test.beforeEach(async ({ page }) => {
    terminal = new TerminalPage(page);
    await terminal.goto();
  });

  test('should navigate to edit activity and load content', async ({ page }) => {
    // Set test content in localStorage
    await page.evaluate(() => {
      localStorage.setItem(StorageKeys.editContent, JSON.stringify({
        key: '_index.md',
        content: '# Test Content'
      }));
    });

    // Execute edit command
    await terminal.executeCommand('edit _index.md');

    // Verify navigation
    await expect(page).toHaveURL(/activity=edit\?key=_index\.md/);

    // Verify MonacoEditor is visible
    const editor = page.locator('.monaco-editor');
    await expect(editor).toBeVisible();

    // Verify content loaded
    const editorContent = await page.evaluate(() => {
      const editor = window.monacoEditor as IStandaloneCodeEditor | undefined;
      if (!editor) {
        throw new Error('Monaco editor not found');
      }
      const value = editor.getValue();
      if (typeof value !== 'string') {
        throw new Error('Expected string value from editor');
      }
      return value;
    });
    expect(editorContent).toContain('# Test Content');
  });

  test('should show error for invalid file', async ({ page }) => {
    await terminal.executeCommand('edit invalid.md');

    // Verify error message
    const error = page.locator('.error-message');
    await expect(error).toContainText('File not found');
  });
});
