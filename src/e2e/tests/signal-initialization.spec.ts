import { test, expect } from '@playwright/test';
import { ActivityType } from '@handterm/types';
import { parseLocation } from '../../utils/navigationUtils';

test.describe('Signal Initialization', () => {
  test('should initialize activity from URL', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    const parsedLocation = parseLocation(url);

    expect(parsedLocation.activityKey).toBe(ActivityType.NORMAL);
  });

  test('should handle multiple navigations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Navigate twice
    await page.goto('/?activity=edit');
    await page.goto('/?activity=tree');

    const url = page.url();
    const parsedLocation = parseLocation(url);
    expect(parsedLocation.activityKey).toBe(ActivityType.TREE);
  });
});
