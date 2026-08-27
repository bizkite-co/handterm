/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Page } from '@playwright/test';
import { TEST_CONFIG } from '../config';

declare global {
	interface Window {
		setCompletedTutorial: (key: string) => void;
		getNextTutorial: () => unknown;
	}
}

export async function setupBrowserWindow(page: Page): Promise<void> {
	// Wait for the app to mount and expose window functions.
	// These are set in HandTermWrapper.tsx's useEffect, which runs
	// after React mounts — so we must wait, not check immediately.
	await page.waitForFunction(() => {
		return typeof (window as any).setActivity === 'function' &&
		       typeof (window as any).setNextTutorial === 'function' &&
		       typeof (window as any).setCompletedTutorial === 'function' &&
		       typeof (window as any).getNextTutorial === 'function';
	}, null, { timeout: TEST_CONFIG.timeout.long });
}