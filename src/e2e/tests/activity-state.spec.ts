import { test, expect, type Page } from '@playwright/test';
import { TEST_CONFIG } from '../config';
import { parseLocation } from '../../utils/navigationUtils';
import { ActivityType } from '@handterm/types';

test.describe('Activity State', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    // await page.goto(TEST_CONFIG.baseUrl); // Removed initial goto, will set URL in each test
  });

  test('can set activity state via URL', async () => {
    await page.goto(`${TEST_CONFIG.baseUrl}?activity=edit`);
    const url = page.url();
    const parsedLocation = parseLocation(url);

    expect(parsedLocation.activityKey).toBe(ActivityType.EDIT);
  });

  test('can update activity state via URL', async () => {
    await page.goto(`${TEST_CONFIG.baseUrl}?activity=normal`); // Start in normal mode
    let url = page.url();
    let parsedLocation = parseLocation(url);
    expect(parsedLocation.activityKey).toBe(ActivityType.NORMAL);

    await page.goto(`${TEST_CONFIG.baseUrl}?activity=edit`); // Change to edit mode
    url = page.url();
    parsedLocation = parseLocation(url);
    expect(parsedLocation.activityKey).toBe(ActivityType.EDIT);
  });

  test.afterEach(async () => {
    await page.close();
  });
});