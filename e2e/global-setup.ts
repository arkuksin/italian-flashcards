import { chromium } from '@playwright/test';

async function globalSetup() {
  const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173';
  const bypassToken = process.env.VERCEL_BYPASS_TOKEN;
  const testEmail = process.env.TEST_USER_EMAIL || 'test-e2e@example.com';
  const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

  console.log('🔍 DEBUG: Starting global setup');
  console.log('🔍 DEBUG: baseURL:', baseURL);
  console.log('🔍 DEBUG: bypassToken exists:', !!bypassToken);
  console.log('🔍 DEBUG: testEmail:', testEmail);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Setup 1: Vercel bypass (if needed)
    if (bypassToken && baseURL.includes('vercel.app')) {
      console.log('🔍 Setting up Vercel bypass authentication...');
      const bypassUrl = `${baseURL}?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${bypassToken}`;
      await page.goto(bypassUrl, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);
      console.log('✅ Vercel bypass configured');
    }

    // Setup 2: Authenticate user once for all tests
    console.log('🔍 Setting up shared authentication state...');
    console.log('🔍 Navigating to:', baseURL);
    await page.goto(baseURL, { timeout: 15000 });

    console.log('🔍 Waiting for login form...');
    // Wait for login form with shorter timeout
    await page.locator('text=Sign in to continue').waitFor({ timeout: 5000 });

    console.log('🔍 Filling login form...');
    // Perform login
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', testPassword);

    console.log('🔍 Submitting login form...');
    await page.click('[data-testid="submit-button"]');

    // Wait for either redirect or error message
    console.log('🔍 Waiting for authentication response...');
    await page.waitForTimeout(2000); // Give it time to process

    // Check for error messages
    const errorElement = await page.locator('[data-testid="error-message"]').count();
    if (errorElement > 0) {
      const errorText = await page.locator('[data-testid="error-message"]').textContent();
      console.log('❌ Login error displayed:', errorText);
    }

    console.log('🔍 Current URL after submit:', page.url());

    // Wait for redirect to dashboard (URL should change from /login)
    console.log('🔍 Waiting for redirect from /login...');
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });

    console.log('🔍 Waiting for protected content to appear...');
    await page.locator('[data-testid="protected-content"]').waitFor({ timeout: 5000 });

    // Save authenticated state for all tests to reuse
    await context.storageState({ path: 'playwright-auth-state.json' });
    console.log('✅ Shared authentication configured successfully');

  } catch (error) {
    console.error('❌ Failed to set up authentication:', error);
    console.log('🔍 DEBUG: Current URL:', page.url());
    console.log('🔍 DEBUG: Page content preview:');
    const content = await page.content();
    console.log(content.substring(0, 500));
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
