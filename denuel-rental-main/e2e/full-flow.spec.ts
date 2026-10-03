import { test, expect } from '@playwright/test';

test('landlord creates property and tenant messages -> landlord receives notification', async ({ page, browser }) => {
  const landlordEmail = 'landlord@denuel.local';
  const landlordPass = 'Landlord#1234';
  const tenantEmail = 'tenant@denuel.local';
  const tenantPass = 'Tenant#1234';

  // Landlord login
  await page.goto('/auth/login');
  await page.fill('input[placeholder="Email"]', landlordEmail);
  await page.fill('input[placeholder="Password"]', landlordPass);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL('/dashboard');

  // Create a property via the create form
  await page.goto('/dashboard/properties');
  await page.fill('input[placeholder="Title"]', 'E2E Test House');
  await page.fill('textarea[placeholder="Description"]', 'E2E property description');
  await page.fill('input[placeholder="Price"]', '900');
  await page.fill('input[placeholder="Location"]', 'Test Area');
  await page.fill('input[type="number"]', '2'); // bedrooms/bathrooms fields; may need exact selectors
  await page.click('button:has-text("Create Property")');

  // Wait for creation message
  await page.waitForSelector('text=Property created');

  // Find the created property via API to get id
  const created = await page.evaluate(async () => {
    const res = await fetch('/api/properties?q=E2E Test House');
    const json = await res.json();
    return json.items?.[0];
  });
  expect(created).toBeDefined();

  const propertyId = created.id;

  // Add availability via edit page
  await page.goto(`/dashboard/properties/${propertyId}/edit`);
  await page.fill('input[type="date"]', '2025-01-01');
  const dateInputs = await page.$$('input[type="date"]');
  if (dateInputs.length >= 2) {
    await dateInputs[0].fill('2025-01-01');
    await dateInputs[1].fill('2025-01-10');
  }
  await page.click('button:has-text("Add range")');
  await page.waitForSelector('text=2025');

  // Now logout the landlord (navigate to logout via API)
  await page.request.post('/api/auth/logout');

  // Tenant login in new context
  const tenantContext = await browser.newContext();
  const tenantPage = await tenantContext.newPage();
  await tenantPage.goto('/auth/login');
  await tenantPage.fill('input[placeholder="Email"]', tenantEmail);
  await tenantPage.fill('input[placeholder="Password"]', tenantPass);
  await tenantPage.click('button:has-text("Sign in")');
  await tenantPage.waitForURL('/dashboard');

  // Visit property page and send message (as tenant)
  await tenantPage.goto(`/property/${propertyId}`);
  await tenantPage.fill('textarea', 'Hello, I am interested');
  await tenantPage.click('button:has-text("Send Message")');
  await tenantPage.waitForSelector('text=Sent');

  // Landlord should receive notification; login landlord again
  await page.goto('/auth/login');
  await page.fill('input[placeholder="Email"]', landlordEmail);
  await page.fill('input[placeholder="Password"]', landlordPass);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL('/dashboard');

  // Go to notifications page and assert notification exists
  await page.goto('/notifications');
  await page.waitForSelector('text=inquiry');
  const note = await page.locator('text=Hello, I am interested').first();
  await expect(note).toBeVisible();
});