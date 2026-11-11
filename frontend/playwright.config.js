// frontend/playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/visual',
  snapshotDir: './tests/visual/baseline',
  snapshotPathTemplate: '{testDir}/baseline/{arg}{ext}',
  timeout: 30000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    },
  },
  fullyParallel: false, // Governance §15: Prevent workstation memory exhaustion
  workers: 1,           // Single-worker execution locally
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    storageState: './tests/visual/fixtures/.auth.json',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
    },
    {
      name: 'visual',
      dependencies: ['setup'],
      testMatch: /visual\.spec\.js/,
    },
    {
      name: 'reference',
      testMatch: /reference-frames\.spec\.js/,
    },
    {
      name: 'pr-subset',
      dependencies: ['setup'],
      testMatch: /visual\.spec\.js/,
    },
    {
      name: 'a11y',
      dependencies: ['setup'],
      testMatch: /a11y\.spec\.js/,
    },
  ],
  webServer: [
    {
      command: process.env.CI
        ? 'npm run build && npx serve -s build -l 3000'
        : 'npm start',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'npx http-server .. -p 3001 --cors -c-1',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
});

