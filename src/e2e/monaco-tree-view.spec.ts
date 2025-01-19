import { ActivityType } from 'src/types/Types';
import { test, expect } from '@playwright/test';
import { signal } from '@preact/signals-react';

test.describe('Monaco Editor Tree View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('should load tree view from localStorage', async ({ page }) => {
    // Navigate to page with tree activity
    await page.goto('http://localhost:5173/?activity=tree');

    // Setup mock tree data
    const mockTreeData = [
      { path: 'src/main.ts', type: 'blob' },
      { path: 'src/components', type: 'tree' }
    ];
    await page.evaluate((data) => {
      localStorage.setItem('github_tree_items', JSON.stringify(data));
    }, mockTreeData);

    // Initialize activity signal
    await page.addInitScript(() => {
      window.activitySignal = signal(ActivityType.TREE);
    });

    // Wait for tree activity to be set
    await page.waitForFunction(() => {
      return window.activitySignal?.value === ActivityType.TREE;
    });

    // Wait for Monaco editor initialization and tree view rendering
    await page.waitForFunction(() => {
      const editor = window.monacoEditor;
      if (!editor) return false;
      const content = editor.getValue();
      return content.includes('src/main.ts') && content.includes('src/components');
    }, { timeout: 5000 });

    // Verify tree view content
    const editorContent = await page.evaluate(() => {
      return window.monacoEditor?.getValue() || '';
    });

    console.log('Editor content:', editorContent);
    expect(editorContent).toContain('src/main.ts');
    expect(editorContent).toContain('src/components');
    expect(editorContent).toMatch(/src\/main\.ts\s+\[file\]/);
    expect(editorContent).toMatch(/src\/components\s+\[directory\]/);
  });

  test('should update tree view when localStorage changes', async ({ page }) => {
    // Initial empty state
    const editorContent = await page.locator('.monaco-editor textarea').inputValue();
    expect(editorContent).toContain('No files available');

    // Update localStorage
    const mockTreeData = [
      { path: 'src/main.ts', type: 'blob' }
    ];
    await page.evaluate((data) => {
      localStorage.setItem('github_tree_items', JSON.stringify(data));
    }, mockTreeData);

    // Trigger storage event
    await page.evaluate(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'github_tree_items',
        newValue: JSON.stringify([{ path: 'src/main.ts', type: 'blob' }])
      }));
    });

    // Wait for Monaco editor update
    await page.waitForFunction(() => {
      const content = window.monacoEditor?.getValue() || '';
      return content.includes('src/main.ts');
    });

    // Verify updated content
    const updatedContent = await page.evaluate(() => {
      return window.monacoEditor?.getValue() || '';
    });

    console.log('Updated editor content:', updatedContent);
    expect(updatedContent).toContain('src/main.ts');
    expect(updatedContent).toMatch(/src\/main\.ts\s+\[file\]/);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Setup mock tree data with nested structure
    const mockTreeData = [
      { path: 'src/main.ts', type: 'blob' },
      { path: 'src/components', type: 'tree' },
      { path: 'src/components/Header.tsx', type: 'blob' }
    ];
    await page.evaluate((data) => {
      localStorage.setItem('github_tree_items', JSON.stringify(data));
    }, mockTreeData);

    await page.reload();
    await page.waitForFunction(() => window.monacoEditor !== undefined);

    // Focus the editor
    await page.evaluate(() => window.monacoEditor?.focus());

    // Test down arrow (j key)
    await page.keyboard.press('j');
    let position = await page.evaluate(() => window.monacoEditor?.getPosition());
    expect(position?.lineNumber).toBe(2);

    // Test up arrow (k key)
    await page.keyboard.press('k');
    position = await page.evaluate(() => window.monacoEditor?.getPosition());
    expect(position?.lineNumber).toBe(1);

    // Test directory navigation
    await page.keyboard.press('j'); // Move to directory
    await page.keyboard.press('Enter'); // Expand directory
    await page.waitForFunction(() => {
      const content = window.monacoEditor?.getValue() || '';
      return content.includes('Header.tsx');
    });

    // Test back navigation
    await page.keyboard.press('Control+o');
    await page.waitForFunction(() => {
      const content = window.monacoEditor?.getValue() || '';
      return content.includes('src/components') && !content.includes('Header.tsx');
    });

    // Test file selection
    await page.keyboard.press('j'); // Move to file
    await page.keyboard.press('Enter'); // Select file
    const selectedPath = await page.evaluate(() => window.selectedFilePath);
    expect(selectedPath).toBe('src/main.ts');
  });
});
