import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: { headless: true, baseURL: 'http://localhost:3000' },
  webServer: { command: 'npm run dev', port: 3000, reuseExistingServer: !process.env.CI }
});
