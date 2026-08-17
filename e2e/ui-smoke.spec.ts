import { expect, test } from '@playwright/test';

test.describe('UI accessibility smoke', () => {
  test('landing page loads for a rural-phone visitor', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Smart Agro/i);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('login form shows client-side email validation', async ({ page }) => {
    await page.goto('/login');
    const email = page.locator('input[type="email"]');
    await email.fill('not-an-email');
    await email.blur();
    await expect(page.locator('.auth-slide-hint.error')).toBeVisible();
  });
});
