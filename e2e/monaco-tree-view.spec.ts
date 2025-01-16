import { test, expect } from '@playwright/test';

interface TreeItem {
  path: string;
  type: 'file' | 'directory';
}

test.describe('Monaco Editor Tree View', () => {
  test.beforeEach(async ({ page }) => {
    // Set up mock tree data in localStorage
    const mockTreeItems: TreeItem[] = [
      { path: 'src/', type: 'directory' },
      { path: 'src/components/', type: 'directory' },
      { path: 'src/components/MonacoEditor.tsx', type: 'file' },
      { path: 'src/commands/', type: 'directory' },
      { path: 'src/commands/GitHubCommand.ts', type: 'file' }
    ];

    await page.addInitScript((items) => {
      window.localStorage.setItem('github_tree_items', JSON.stringify(items));
    }, mockTreeItems);

    await page.goto('/');
  });

  test('should load and display tree structure from localStorage', async ({ page }) => {
    // Wait for Monaco editor to load
    const editor = page.locator('.monaco-editor');
    await expect(editor).toBeVisible();

    // Verify tree structure is rendered
    const content = await editor.locator('.view-lines').innerText();
    expect(content).toContain('src/');
    expect(content).toContain('src/components/');
    expect(content).toContain('src/components/MonacoEditor.tsx');
    expect(content).toContain('src/commands/');
    expect(content).toContain('src/commands/GitHubCommand.ts');
  });
});
