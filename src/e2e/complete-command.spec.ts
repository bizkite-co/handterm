import { type Page, test, expect } from '@playwright/test';
import { StorageKeys, allTutorialKeys } from '@handterm/types';
import { TerminalPage } from './page-objects/TerminalPage';
import { verifyLocalStorage } from './test-utils/setup';

test.describe('Complete Command', () => {
  let terminal: TerminalPage;
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    terminal = new TerminalPage(page);

    // Navigate first
    await terminal.goto();

    // Clear storage after navigation
    await page.evaluate((): void => {
      localStorage.clear();
    });
  });

  test('should mark tutorials as completed and navigate home', async () => {
    // Verify initial state
    const initialState = await verifyLocalStorage(page, StorageKeys.completedTutorials);
    expect(initialState).toBeNull();

    // Execute complete command
    await terminal.executeCommand('complete');

    // Wait for storage to be updated with all tutorial keys
    await page.waitForFunction(
      (args: string[]) => {
        const [key, expected] = args;
        const value = localStorage.getItem(key ?? '');
        return value === expected;
      },
      [StorageKeys.completedTutorials, JSON.stringify(allTutorialKeys)],
      { timeout: 5000 }
    );

    // Verify final state
    const completedTutorials = await verifyLocalStorage(page, StorageKeys.completedTutorials);
    expect(completedTutorials).toEqual(allTutorialKeys);

    // Verify we're not in tutorial mode
    await expect(page).not.toHaveURL(/activity=tutorial/, { timeout: 5000 });
  });
});
