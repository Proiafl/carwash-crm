import { test, expect } from '@playwright/test';

test('landing page has title', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('nav')).toBeVisible();
});

test('can navigate to auth page', async ({ page }) => {
  await page.goto('/auth');
  await expect(page.getByPlaceholder('tu@email.com')).toBeVisible();
});

test('check-in flow starts', async ({ page }) => {
  await page.goto('/checkin');
  await expect(page.getByText('Check-in Automático')).toBeVisible();
  await expect(page.getByPlaceholder('AAA 123')).toBeVisible();
});
