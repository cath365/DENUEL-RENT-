import { test, expect } from '@playwright/test';

test('search and map interaction', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('input[placeholder="Search by city, neighborhood, address..."]')).toBeVisible();
  await page.fill('input[placeholder="Search by city, neighborhood, address..."]', 'Lusaka');
  await page.waitForTimeout(500); // allow suggestions
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/search|rent/);
  // basic map presence
  await expect(page.locator('.mapboxgl-canvas')).toBeVisible();
});