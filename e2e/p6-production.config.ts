import { defineConfig, devices } from '@playwright/test'

import base from './p3-production.config'
export default defineConfig({
  ...base,
  testDir: '.',
  fullyParallel: false,
  workers: 1,
  use: {
    ...base.use,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  },
  webServer: {
    command: 'bunx next start --port 3003',
    cwd: process.cwd(),
    url: 'http://localhost:3003',
    reuseExistingServer: false,
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit', viewport: { width: 1440, height: 1000 } },
    },
    { name: 'phone', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
  ],
})
