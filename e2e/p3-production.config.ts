import { defineConfig } from '@playwright/test'

import base from '../playwright.config'
// Same complete suite and projects as the repository config, on an isolated
// production port so another developer's localhost:3000 stays untouched.
export default defineConfig({
  ...base,
  testDir: '.',
  workers: 2,
  use: { ...base.use, baseURL: 'http://localhost:3003' },
  webServer: {
    command: 'bunx next start --port 3003',
    cwd: process.cwd(),
    url: 'http://localhost:3003',
    reuseExistingServer: false,
    timeout: 120000,
  },
})
