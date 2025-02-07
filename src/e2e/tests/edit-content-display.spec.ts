import { test, expect } from '@playwright/test';
import { TerminalPage } from '../page-objects/TerminalPage';
import { TEST_CONFIG } from '../config';
import type { ActivityType } from '@handterm/types';

test.describe('Edit Content Display', () => {
  let terminal: TerminalPage;

  test.beforeEach(async ({ page }) => {
    // Mock activity state and signals
    await page.evaluate(() => {
      // Set up completed tutorials
      window.completedTutorialsSignal = { value: new Set(['\\r', 'fdsa', 'jkl;']) };

      // Set up activity state
      window.activityStateSignal = {
        value: {
          current: 'edit',
          previous: 'tutorial',
          transitionInProgress: false,
          tutorialCompleted: true
        }
      };

      // Set up activity setter
      window.setActivity = (activity) => {
        window.activityStateSignal.value.current = activity;
      };
    });

    terminal = new TerminalPage(page);
    await terminal.goto();

    // Wait for application to be ready
    await page.waitForSelector('#handterm-wrapper', { state: 'attached', timeout: TEST_CONFIG.timeout.medium });
  });

  test('displays content from localStorage in editor', async ({ page }) => {
    // Set up test content in localStorage
    const testContent = {
      key: '_index.md',
      content: '# Test Content'
    };

    await page.evaluate((content) => {
      localStorage.setItem('edit-content', JSON.stringify(content));
    }, testContent);

    // Execute edit command
    await terminal.executeCommand('edit _index.md');

    // Verify navigation to edit activity
    await expect(page).toHaveURL(/activity=edit\?key=_index\.md/);

    // Verify MonacoEditor is visible
    const editor = page.locator('.monaco-editor');
    await expect(editor).toBeVisible();

    // Verify content loaded in editor
    const editorContent = await page.evaluate(() => {
      const editor = window.monacoEditor;
      if (!editor) {
        throw new Error('Monaco editor not found');
      }
      const value = editor.getValue();
      if (typeof value !== 'string') {
        throw new Error('Expected string value from editor');
      }
      return value;
    });
    expect(editorContent).toBe(testContent.content);
  });

  test('updates editor when content changes in localStorage', async ({ page }) => {
    // Set initial content
    await page.evaluate(() => {
      localStorage.setItem('edit-content', JSON.stringify({
        key: 'test.md',
        content: 'Initial content'
      }));
    });

    // Execute edit command
    await terminal.executeCommand('edit test.md');

    // Verify initial content
    await expect(page).toHaveURL(/activity=edit\?key=test\.md/);
    const editor = page.locator('.monaco-editor');
    await expect(editor).toBeVisible();

    let editorContent = await page.evaluate(() => {
      const editor = window.monacoEditor;
      return editor?.getValue() ?? '';
    });
    expect(editorContent).toBe('Initial content');

    // Update content in localStorage
    const updatedContent = {
      key: 'test.md',
      content: 'Updated content'
    };

    await page.evaluate((content) => {
      localStorage.setItem('edit-content', JSON.stringify(content));
    }, updatedContent);

    // Execute edit command again
    await terminal.executeCommand('edit test.md');

    // Verify updated content
    editorContent = await page.evaluate(() => {
      const editor = window.monacoEditor;
      return editor?.getValue() ?? '';
    });
    expect(editorContent).toBe('Updated content');
  });

  test('shows error for non-existent file', async ({ page }) => {
    await terminal.executeCommand('edit nonexistent.md');

    // Wait for error message
    const error = page.locator('.error-message');
    await expect(error).toContainText('File not found', { timeout: TEST_CONFIG.timeout.medium });
  });
});