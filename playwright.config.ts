import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

// Load test environment variables (local development only)
// In CI, environment variables are provided by GitHub Actions
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '.env.test.local');
if (!process.env.CI && existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const includeFirefox = process.env.PLAYWRIGHT_INCLUDE_FIREFOX === 'true';
const smokeTag = /@smoke/;

/**
 * @see https://playwright.dev/docs/test-configuration
 */
const config = defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only - DISABLED FOR DEBUGGING */
  retries: 0, // Reduced to 1 for faster feedback
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Optimized timeouts for fast CI feedback */
  timeout: 30000, // 30 seconds per test (increased for slower CI + Vercel deploy)
  expect: {
    timeout: 5000, // 5 seconds for assertions (reduced from 10s)
  },
  /* Global setup for shared authentication */
  globalSetup: './e2e/global-setup.ts',
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['junit', { outputFile: 'test-results/test-results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173',
    /* Use shared authentication state for all tests */
    storageState: 'playwright-auth-state.json',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshots on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      grep: smokeTag,
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev:test',
    url: 'http://localhost:5173',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI, // Reuse in dev for speed, fresh in CI for test env vars
  },
});

if (includeFirefox) {
  config.projects?.push({
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  });
}

export default config;
