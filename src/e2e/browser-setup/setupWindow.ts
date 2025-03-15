// @ts-nocheck
import { setActivity } from '../../signals/appSignals';
import type { Page } from '@playwright/test';
import {
 setCompletedTutorial,
 setNextTutorial
} from '../../signals/tutorialSignals';
import { createLogger } from '../../utils/Logger';

const logger = createLogger({prefix: 'setupWindow'});

export async function setupBrowserWindow(page: Page) {

    // Expose a function on the window object
    await page.exposeFunction('myFunction', () => {
        console.log('myFunction called');
    });

    logger.debug('Setting up window');
}