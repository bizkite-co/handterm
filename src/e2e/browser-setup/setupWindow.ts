/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Page } from '@playwright/test';
import { setActivity } from '../../signals/appSignals';
import type { GamePhrase } from "@handterm/types";
import {
	setCompletedTutorial,
	getNextTutorial,
	setNextTutorial
} from '../../signals/tutorialSignals';
import { createLogger } from '../../utils/Logger';

declare global {
	interface Window {
		createLogger: (options: { prefix: string }) => {
			log: (...args: unknown[]) => void;
			debug: (...args: unknown[]) => void;
			info: (...args: unknown[]) => void;
			warn: (...args: unknown[]) => void;
			error: (...args: unknown[]) => void;
		};
		callSetCompletedTutorial: (key: string) => void;
		callGetNextTutorial: () => GamePhrase | null;
		callSetNextTutorial: (tutorial: GamePhrase | null) => void;
	}
}

export async function setupBrowserWindow(page: Page): Promise<void> {
	// Verify the setup.  All setup now happens BEFORE this function is called in the test.
	const verification = await page.evaluate(() => {
		return {
			hasSetCompletedTutorial: typeof window.setCompletedTutorial === 'function',
			hasSetActivity: typeof window.setActivity === 'function',
			hasGetNextTutorial: typeof window.getNextTutorial === 'function',
			hasSetNextTutorial: typeof window.setNextTutorial === 'function',
		};
	});

	if (!verification.hasSetCompletedTutorial || !verification.hasSetActivity || !verification.hasGetNextTutorial || !verification.hasSetNextTutorial) {
		throw new Error(`Window setup failed: ${JSON.stringify(verification)}`);
	}
}