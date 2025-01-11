import { test, expect } from '@playwright/test';
import { login } from '../support/auth';

test.describe('Login persistence', () => {
  test('should maintain login state across page refresh', async ({ page }) => {
    // Login and verify dashboard
    await login(page);
    await expect(page.getByText('Dashboard')).toBeVisible();

    // Verify tokens in localStorage
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();

    // Refresh page and verify state
    await page.reload();
    await expect(page.getByText('Dashboard')).toBeVisible();

    // Verify tokens were refreshed if needed
    const newAccessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(newAccessToken).toBeTruthy();
    expect(newAccessToken).not.toEqual(accessToken);
  });
});
