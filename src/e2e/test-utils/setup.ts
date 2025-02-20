import type { Page } from '@playwright/test';
import { initializeActivitySignal } from '../helpers/initializeSignals';
import { TEST_CONFIG } from '../config';
import { ActivityType } from '@handterm/types';

export async function setupTestEnvironment(page: Page) {
	// Clear specific localStorage keys
	await page.evaluate(() => {
		const keysToRemove = [
			'lastActivity',
			'edit-content',
			'canvasHeight',
			'currentCommand',
			'github_tree_items',
			'command-history',
			'completed-tutorials',
			'phrasesAchieved',
			'current_github_repo',
			'tutorial-state',
			'accessToken',
			'refreshToken',
			'expiresAt',
			'expiresIn',
			'idToken',
			'githubUsername',
      'terminalFontSize'
		];
		for (const key of keysToRemove) {
			localStorage.removeItem(key);
		}
	});

	// Navigate to the base URL
	await page.goto(TEST_CONFIG.baseUrl);
	await page.waitForLoadState('domcontentloaded');

	// Initialize signals
	await initializeActivitySignal(page);

	// Ensure the application is in the NORMAL activity state
	await page.evaluate(() => {
		if (typeof window.setActivity === 'function') {
			window.setActivity(ActivityType.NORMAL);
		}
	});

  // Wait for the handterm wrapper to be attached
  await page.waitForSelector('#handterm-wrapper', {
    state: 'attached',
    timeout: TEST_CONFIG.timeout.long
  });
}

export async function verifyLocalStorage(page: Page, key: string): Promise<unknown> {
  return page.evaluate((storageKey) => {
    const value = localStorage.getItem(storageKey);
    console.log(`[Storage Check] ${storageKey}:`, value);
    return value ? JSON.parse(value) : null;
  }, key);
}
