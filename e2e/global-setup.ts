import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173';
  const bypassToken = process.env.VERCEL_BYPASS_TOKEN;
  const testEmail = process.env.TEST_USER_EMAIL || 'test-e2e@example.com';
  const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Setup 1: Vercel bypass (if needed)
    if (bypassToken && baseURL.includes('vercel.app')) {
      console.log('Setting up Vercel bypass authentication...');
      const bypassUrl = `${baseURL}?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${bypassToken}`;
      await page.goto(bypassUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);
    }

    // Setup 2: Authenticate user once for all tests
    console.log('Setting up shared authentication state...');
    await page.goto(baseURL, { timeout: 20000 });

    // Wait for login form
    await page.locator('text=Sign in to continue').waitFor({ timeout: 10000 });

    // Perform login
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="submit-button"]');

    // Wait for successful authentication
    await page.locator('[data-testid="protected-content"]').waitFor({ timeout: 10000 });

    // Save authenticated state for all tests to reuse
    await context.storageState({ path: 'playwright-auth-state.json' });
    console.log('✅ Shared authentication configured successfully');

  } catch (error) {
    console.error('❌ Failed to set up authentication:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;