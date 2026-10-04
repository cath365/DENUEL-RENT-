import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.SCREENSHOT_BASE_URL || 'http://127.0.0.1:3000';
const outDir = path.resolve('site-screenshots');

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

async function capture(context, route, fileName, group, mobile = false) {
  const page = await context.newPage();
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });

  let status = null;
  let error = null;

  try {
    const response = await page.goto(baseURL + route, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    status = response?.status() ?? null;
    await page.waitForTimeout(1800);

    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0.001s !important;
          animation-delay: 0s !important;
          transition-duration: 0.001s !important;
          caret-color: transparent !important;
        }
      `,
    }).catch(() => {});

    await page.screenshot({
      path: path.join(outDir, fileName + '.png'),
      fullPage: true,
    });
  } catch (e) {
    error = String(e?.message || e);
    await page.screenshot({
      path: path.join(outDir, fileName + '-error.png'),
      fullPage: true,
    }).catch(() => {});
  }

  results.push({
    group,
    route,
    file: fileName + (error ? '-error' : '') + '.png',
    status,
    error,
    finalUrl: page.url(),
    title: await page.title().catch(() => ''),
  });

  await page.close();
}

const publicContext = await browser.newContext({
  baseURL,
  viewport: { width: 1440, height: 1000 },
});

const publicPages = [
  ['/', 'public-01-home'],
  ['/rent', 'public-02-rent'],
  ['/buy', 'public-03-buy'],
  ['/land', 'public-04-land'],
  ['/commercial', 'public-05-commercial'],
  ['/market', 'public-06-market'],
  ['/agents', 'public-07-agents'],
  ['/services', 'public-08-services'],
  ['/transport', 'public-09-transport'],
  ['/pricing', 'public-10-pricing'],
  ['/guides', 'public-11-guides'],
  ['/renters-guide', 'public-12-renters-guide'],
  ['/safety-tips', 'public-13-safety'],
  ['/research', 'public-14-research'],
  ['/mortgage-calculator', 'public-15-mortgage-calculator'],
  ['/business-tools/budget-calculator', 'public-16-budget-calculator'],
  ['/auth/login', 'public-17-login'],
  ['/auth/register', 'public-18-register'],
  ['/auth/register/service-provider', 'public-19-service-provider-register'],
  ['/driver/apply', 'public-20-driver-apply'],
  ['/services/register', 'public-21-services-register'],
];

for (const [route, file] of publicPages) {
  await capture(publicContext, route, file, 'public');
  await capture(publicContext, route, file + '-mobile', 'public', true);
}
await publicContext.close();

// Authenticated captures require a pre-existing legitimate browser session.
// Never create accounts or records for screenshots.
if (process.env.SCREENSHOT_STORAGE_STATE) {
  const context = await browser.newContext({ baseURL, storageState: process.env.SCREENSHOT_STORAGE_STATE });
  const routes = ['/dashboard', '/favorites', '/inquiries', '/renter-hub', '/landlord', '/landlord/applications', '/landlord/viewings', '/landlord/leases', '/landlord/payments', '/landlord/maintenance', '/landlord/screening', '/landlord/expenses', '/agent', '/agent/profile', '/agent/clients', '/agent/applications', '/agent/viewings', '/agent/leases', '/agent/payments', '/profile/verification', '/admin', '/admin/service-providers', '/admin/verifications'];
  for (const [index, route] of routes.entries()) {
    await capture(context, route, `authenticated-${index + 1}`, 'authenticated');
  }
  await context.close();
} else {
  console.log('Authenticated pages skipped: no existing legitimate storage state supplied.');
}

await browser.close();

await fs.writeFile(
  path.join(outDir, 'capture-report.json'),
  JSON.stringify(results, null, 2)
);

const failures = results.filter(
  (item) => item.error || (item.status && item.status >= 500)
);

console.log(
  `Captured ${results.length} pages. ${failures.length} page(s) had capture/runtime errors.`
);

if (failures.length) {
  console.log(JSON.stringify(failures, null, 2));
}
