import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123' }
    }).catch(() => {});
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1000);
  });

  test('has viewport meta tag with device-width', async ({ page }) => {
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });

  test('header has correct height per viewport', async ({ page }, testInfo) => {
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    const box = await header.boundingBox();
    expect(box).not.toBeNull();
    const isMobile = testInfo.project.name.startsWith('mobile');
    const expectedHeight = isMobile ? 64 : 80;
    expect(box!.height).toBeCloseTo(expectedHeight, 1);
  });

  test('mobile search overlay opens and contains input', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'Mobile only');
    const searchButton = page.locator('header button.sm\\:hidden:has(.material-symbols-outlined:has-text("search"))');
    await expect(searchButton).toBeVisible();
    await searchButton.click();
    const overlayInput = page.locator('input[placeholder="Buscar..."]');
    await expect(overlayInput).toBeVisible();
    await expect(overlayInput).toBeFocused();
  });

  test('notif dropdown width is constrained to viewport', async ({ page }) => {
    const notifButton = page.locator('#notif-bell');
    await notifButton.click();
    const dropdown = page.locator('div.absolute.mt-3:has-text("Alertas Clínicos Ativos")');
    await expect(dropdown).toBeVisible();
    const box = await dropdown.boundingBox();
    const viewportSize = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewportSize).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(viewportSize!.width);
  });

  test('body is not overflow-hidden', async ({ page }) => {
    const overflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
    expect(overflow).not.toBe('hidden');
  });
});
