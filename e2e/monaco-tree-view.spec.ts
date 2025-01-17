import { test, expect } from '@playwright/test';

test.describe('Monaco Editor Tree View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should display tree view from localStorage', async ({ page }) => {
    // Set mock tree data
    const mockTreeData = [
      { path: 'src/', type: 'tree' },
      { path: 'src/components/', type: 'tree' },
      { path: 'src/components/MonacoEditor.tsx', type: 'blob' },
      { path: 'src/utils/', type: 'tree' },
      { path: 'src/utils/treeFormatter.ts', type: 'blob' }
    ];

    await page.evaluate((data) => {
      localStorage.setItem('github_tree_items', JSON.stringify(data));
    }, mockTreeData);

    // Enable tree view
    await page.getByTestId('tree-view-toggle').click();

    // Verify tree structure
    const editorContent = await page.evaluate(() => {
      return window.monacoEditor.getValue();
    });

    expect(editorContent).toContain('src/');
    expect(editorContent).toContain('├── components/');
    expect(editorContent).toContain('│   └── MonacoEditor.tsx');
    expect(editorContent).toContain('└── utils/');
    expect(editorContent).toContain('    └── treeFormatter.ts');
  });

  test('should handle file selection', async ({ page }) => {
    // Set mock tree data
    const mockTreeData = [
      { path: 'src/components/MonacoEditor.tsx', type: 'blob' }
    ];

    await page.evaluate((data) => {
      localStorage.setItem('github_tree_items', JSON.stringify(data));
    }, mockTreeData);

    // Enable tree view
    await page.getByTestId('tree-view-toggle').click();

    // Select file
    await page.keyboard.press('Enter');

    // Verify file selection callback
    const selectedFile = await page.evaluate(() => {
      return window.selectedFilePath;
    });

    expect(selectedFile).toBe('src/components/MonacoEditor.tsx');
  });
});
