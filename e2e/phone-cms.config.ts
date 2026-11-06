import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: 'phone-cms.e2e.ts',
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:3013',
    browserName: 'chromium',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
})
