import { defineConfig, devices } from '@playwright/test'

// Its specs skip under the main config, which has no fixtures for them.
process.env.M6_TESTS = '1'
export default defineConfig({
  testDir: '.',
  testMatch: ['phone-apps.e2e.ts', 'windows.e2e.ts'],
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: process.env.P6_BASE_URL ?? 'http://localhost:3016',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'pixel', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
    { name: 'iphone', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
    {
      name: 'desktop-800',
      use: { browserName: 'chromium', viewport: { width: 800, height: 1000 } },
    },
    {
      name: 'desktop',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } },
    },
  ],
})
