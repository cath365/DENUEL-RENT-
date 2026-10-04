import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.SCREENSHOT_BASE_URL || 'http://127.0.0.1:3000';
const outDir = path.resolve('site-screenshots');

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

async function capture(context, route, fileName, group) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 1000 });

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
    title: await page.title().catch(() => ''),
  });

  await page.close();
}

async function register(role, email) {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1440, height: 1000 },
  });

  const response = await context.request.post('/api/auth/register', {
    data: {
      email,
      password: 'PreviewOnly123!',
      role,
    },
  });

  if (!response.ok()) {
    throw new Error(
      `Could not create local ${role} preview account: ${response.status()} ${await response.text()}`
    );
  }

  return context;
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
}
await publicContext.close();

const userContext = await register('USER', 'preview-user@nganda.local');
const userPages = [
  ['/dashboard', 'renter-01-dashboard'],
  ['/favorites', 'renter-02-favorites'],
  ['/inquiries', 'renter-03-messages'],
  ['/renter-hub', 'renter-04-hub'],
  ['/my-leases', 'renter-05-leases'],
  ['/rent-payment', 'renter-06-rent-payment'],
  ['/notifications', 'renter-07-notifications'],
  ['/profile/verification', 'renter-08-verification'],
];
for (const [route, file] of userPages) {
  await capture(userContext, route, file, 'renter');
}
await userContext.close();

const landlordContext = await register(
  'LANDLORD',
  'preview-landlord@nganda.local'
);
const landlordPages = [
  ['/landlord', 'landlord-01-dashboard'],
  ['/dashboard/properties', 'landlord-02-properties'],
  ['/dashboard/properties/new', 'landlord-03-add-property'],
  ['/landlord/applications', 'landlord-04-applications'],
  ['/landlord/viewings', 'landlord-05-viewings'],
  ['/landlord/leases', 'landlord-06-leases'],
  ['/landlord/payments', 'landlord-07-payments'],
  ['/landlord/maintenance', 'landlord-08-maintenance'],
  ['/landlord/screening', 'landlord-09-screening'],
  ['/landlord/expenses', 'landlord-10-expenses'],
  ['/inquiries', 'landlord-11-messages'],
  ['/profile/verification', 'landlord-12-verification'],
];
for (const [route, file] of landlordPages) {
  await capture(landlordContext, route, file, 'landlord');
}
await landlordContext.close();

const agentContext = await register(
  'AGENT',
  'preview-agent@nganda.local'
);
const agentPages = [
  ['/agent', 'agent-01-dashboard'],
  ['/agent/profile', 'agent-02-profile'],
  ['/dashboard/properties', 'agent-03-properties'],
  ['/dashboard/properties/new', 'agent-04-add-property'],
  ['/agent/clients', 'agent-05-clients'],
  ['/agent/applications', 'agent-06-applications'],
  ['/agent/viewings', 'agent-07-viewings'],
  ['/agent/leases', 'agent-08-leases'],
  ['/agent/payments', 'agent-09-payments'],
  ['/inquiries', 'agent-10-messages'],
  ['/profile/verification', 'agent-11-verification'],
];
for (const [route, file] of agentPages) {
  await capture(agentContext, route, file, 'agent');
}
await agentContext.close();

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
