import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  use: { browserName: 'chromium', channel: 'chrome', acceptDownloads: true },
});
