import { test, expect } from '@playwright/test';

const mockTreeData = [
  { path: 'src/', type: 'directory' },
  { path: 'src/components/', type: 'directory' },
  { path: 'src/components/MonacoEditor.tsx', type: 'file' },
  { path: 'src/utils/', type: 'directory' },
  { path: 'src/utils/treeFormatter.ts', type: 'file' }
];

test.beforeEach(async ({ page }) => {
  // Set mock tree data in localStorage before each test
  await page.addInitScript((data) => {
    window.localStorage.setItem('github_tree_items', JSON.stringify(data));
  }, mockTreeData);
});

test.afterEach(async ({ page }) => {
  // Clean up localStorage after each test
  await page.evaluate(() => {
    window.localStorage.removeItem('github_tree_items');
  });
});

test('should load and display tree view from localStorage', async ({ page }) => {
  await page.goto('/');

  // Wait for Monaco editor to load
  await page.waitForSelector('.monaco-editor');

  // Verify tree structure is displayed
  const treeItems = await page.$$eval('.tree-item', items =>
    items.map(el => el.textContent)
  );

  expect(treeItems).toEqual([
    'src/',
    'src/components/',
    'src/components/MonacoEditor.tsx',
    'src/utils/',
    'src/utils/treeFormatter.ts'
  ]);

  // Verify localStorage was set correctly
  const localStorageData = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('github_tree_items') || '[]')
  );
  expect(localStorageData).toEqual(mockTreeData);
});

test('should handle empty localStorage', async ({ page }) => {
  // Clear localStorage for this test
  await page.evaluate(() => {
    window.localStorage.removeItem('github_tree_items');
  });

  await page.goto('/');

  // Verify empty state is handled
  const emptyState = await page.$('.empty-state');
  expect(emptyState).toBeTruthy();
});

test('should handle malformed localStorage data', async ({ page }) => {
  // Set invalid data in localStorage
  await page.evaluate(() => {
    window.localStorage.setItem('github_tree_items', 'invalid-json');
  });

  await page.goto('/');

  // Verify error state is handled
  const errorState = await page.$('.error-state');
  expect(errorState).toBeTruthy();
});
