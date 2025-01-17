import { test, expect } from '@playwright/test';
import type {} from '../src/types/window';

test.describe('Monaco Editor Tree View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should display tree view from localStorage', async ({ page }) => {
    // Setup mock tree data
    const mockTreeData = [
  { path: 'src/', type: 'directory' },
  { path: 'src/components/', type: 'directory' },
  { path: 'src/components/MonacoEditor.tsx', type: 'file' },
      { path: 'src/commands/', type: 'directory' },
      { path: 'src/commands/GitHubCommand.ts', type: 'file' }
];

    // Set localStorage data
    await page.evaluate((data) => {
      localStorage.setItem('github_tree_items', JSON.stringify(data));
  }, mockTreeData);

    // Debug: Verify localStorage was set
    const storedItems = await page.evaluate(() => localStorage.getItem('github_tree_items'));
    console.log('Stored items:', storedItems);

    // Wait for editor to load
    await page.waitForSelector('.monaco-editor', { state: 'visible', timeout: 30000 });
    console.log('Editor loaded');

    // Take screenshot for debugging
    await page.screenshot({ path: 'temp/monaco-editor.png', fullPage: true });
    console.log('Screenshot saved to temp/monaco-editor.png');

    // Wait for component to process localStorage changes
    await page.waitForTimeout(1000);

    // Wait for and enable tree view
    const toggleButton = page.locator('[data-testid="tree-view-toggle"]');
    await toggleButton.waitFor({ state: 'visible', timeout: 30000 });
    console.log('Toggle button found:', await toggleButton.isVisible());
    await toggleButton.click();

    // Wait for tree view to render
    await page.waitForTimeout(1000);

    // Take screenshot after toggling tree view
    await page.screenshot({ path: 'temp/monaco-tree-view.png', fullPage: true });
    console.log('Tree view screenshot saved to temp/monaco-tree-view.png');

    // Verify tree view content
    const editorContent = await page.evaluate((): string => {
      const editor = window.monacoEditor;
      if (!editor) {
        console.error('monacoEditor not found on window');
        return '';
      }
      try {
        return editor.getValue();
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('Failed to get editor content:', error.message);
        } else {
          console.error('Failed to get editor content: Unknown error');
        }
        return '';
      }
    });

    expect(editorContent).toContain('src/');
    expect(editorContent).toContain('src/components/');
    expect(editorContent).toContain('src/components/MonacoEditor.tsx');
  });
});
