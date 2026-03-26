import { devices, type PlaywrightTestConfig } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default {
  testDir: './test/e2e',
  testMatch: /\.e2e\.ts/,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? '100%' : '66%',
  timeout: (process.env.CI ? 60 : 30) * 1000,
  fullyParallel: true,
  expect: { timeout: 10_000 },
  use: {
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    baseURL: 'http://localhost:4009',
  },
  projects: [
    {
      name: 'chrome',
      use: {
        contextOptions: {
          reducedMotion: 'reduce',
          permissions: ['clipboard-read', 'clipboard-write'],
        },
        ...devices['Desktop Chrome'],
        channel: 'chromium',
      },
    },
    {
      name: 'firefox',
      use: {
        contextOptions: {
          reducedMotion: 'reduce',
        },
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'safari',
      use: {
        contextOptions: {
          reducedMotion: 'reduce',
        },
        ...devices['Desktop Safari'],
      },
    },
  ],
  webServer: {
    command: 'npm run start:msw -- --port 4009',
    port: 4009,
  },
} satisfies PlaywrightTestConfig
