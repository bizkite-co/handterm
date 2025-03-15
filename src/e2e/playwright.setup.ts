// @ts-nocheck
import { chromium, type FullConfig } from '@playwright/test';
import { TEST_CONFIG } from './config';
import { assert } from 'console';

async function globalSetup(config: FullConfig) {
  console.log('Running global setup');
  // const browser = await chromium.launch();
  // const page = await browser.newPage();
  // await page.goto(TEST_CONFIG.baseUrl);

  // // Save signed-in state to 'storageState.json'.
  // await page.context().storageState({ path: 'storageState.json' });
  // await browser.close();
}

export default globalSetup;
