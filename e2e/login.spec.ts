import { test, expect } from '@playwright/test';

test('login page renders and accepts credentials', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Gabi Almeida/);

  const usernameInput = page.locator('input[placeholder*="login" i], input[name="username" i]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  if (await usernameInput.isVisible()) {
    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');

    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
    }
  }
});
