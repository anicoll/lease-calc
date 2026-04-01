import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  snapshotDir: './tests/screenshots',
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:5173/lease-calc/',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
})
