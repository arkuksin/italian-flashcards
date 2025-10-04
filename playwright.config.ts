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

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0, // Reduced to 1 for faster feedback
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Optimized timeouts for fast CI feedback */
  timeout: 30000, // 30 seconds per test (increased for slower CI + Vercel deploy)
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },
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
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      // Force dev server to use test database for local E2E tests
      // Use env vars from .env.test.local or fallback to test database
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://slhyzoupwluxgasvapoc.supabase.co',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsaHl6b3Vwd2x1eGdhc3ZhcG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMDY5OCwiZXhwIjoyMDc0NTc2Njk4fQ.hxK65OHKF8ScncLF7zlcu0qEYgKAqipmtAT2UySKVwg',
    },
  },
});