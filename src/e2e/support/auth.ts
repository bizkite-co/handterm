import type { Page } from '@playwright/test';

export async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Username').fill('testuser');
  await page.getByLabel('Password').fill('testpassword');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('/dashboard');
}
