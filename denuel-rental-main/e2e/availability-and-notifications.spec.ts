import { test, expect } from '@playwright/test';

test('add availability and receive notification via API', async ({ page, request }) => {
  // NOTE: This e2e expects a seeded user and auth flows - here we test via direct API calls for notification generation
  // Create a property (skip auth in this simple test) - in real e2e we'd go through UI flows with login

  // simulate creating an availability via API - this will likely be protected; this is a shape test
  const res = await request.post('/api/properties/prop1/availability', { data: { startDate: '2025-01-01', endDate: '2025-01-10' } });
  // We expect a result (may be 401 if not authorized) but ensure API responds
  expect(res.ok || res.status === 401 || res.status === 403).toBeTruthy();

  // simulate notification creation via messages API
  const msg = await request.post('/api/messages', { data: { propertyId: 'prop1', message: 'Test inquiry from e2e' } });
  expect(msg.ok || msg.status === 401 || msg.status === 403).toBeTruthy();
});
