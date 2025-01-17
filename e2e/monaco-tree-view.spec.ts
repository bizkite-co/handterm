import { test, expect } from '@playwright/test';

test.describe('Monaco Editor Tree View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('should load tree view from localStorage', async ({ page }) => {
    // Setup mock tree data
    const mockTreeData = [
      { path: 'src/main.ts', type: 'blob' },
      { path: 'src/components', type: 'tree' }
    ];
    await page.evaluate((data) => {
      localStorage.setItem('github_tree_items', JSON.stringify(data));
    }, mockTreeData);

    // Reload page to trigger tree view initialization
    await page.reload();

    // Wait for Monaco editor initialization
    await page.waitForFunction(() => window.monacoEditor !== undefined);

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
});
