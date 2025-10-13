import { test, expect } from '@playwright/test';

/**
 * Quick Auth Check - Minimal test for fast local debugging
 *
 * This test file contains only the essential authentication test
 * to quickly verify if the app is accessible and auth form renders.
 *
 * Run with: npm run test:e2e -- e2e/quick-auth-check.spec.ts
 */

test.describe('Quick Auth Check', () => {
  test.use({
    // Force fresh session so login UI can be validated
    storageState: { cookies: [], origins: [] },
  });
  test('can access app and find auth form', async ({ page }) => {
    console.log('🚀 Starting quick auth check...');
    console.log('📍 Base URL:', page.context()._options.baseURL || process.env.PLAYWRIGHT_TEST_BASE_URL);

    // Navigate to the application
    await page.goto('/', { timeout: 15000 });

    console.log('✅ Page loaded');
    console.log('📄 URL:', page.url());
    console.log('📜 Title:', await page.title());

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/quick-check-initial-load.png', fullPage: true });
    console.log('📸 Screenshot saved to test-results/quick-check-initial-load.png');

    // Log page content for debugging
    const bodyText = await page.locator('body').textContent();
    console.log('📝 Page text (first 200 chars):', bodyText?.substring(0, 200));

    // Check if we hit Vercel password protection
    const isVercelAuth = await page.locator('text=Authentication Required').count() > 0;
    if (isVercelAuth) {
      console.log('🔐 DETECTED: Vercel Password Protection page');
      console.log('❌ Cannot proceed - hitting Vercel auth wall, not app auth');

      // Get all test IDs on page
      const testIds = await page.locator('[data-testid]').allTextContents();
      console.log('🏷️ Test IDs found:', testIds);

      throw new Error('Blocked by Vercel Password Protection - bypass token not working');
    }

    // Wait a moment for any loading states
    await page.waitForTimeout(2000);

    // Look for auth form elements
    const hasAuthForm = await page.locator('[data-testid="auth-form-subtitle"]').count() > 0;
    console.log('🔍 Auth form present:', hasAuthForm);

    if (!hasAuthForm) {
      // Debug: what elements do we have?
      const allTestIds = await page.evaluate(() => {
        const elements = document.querySelectorAll('[data-testid]');
        return Array.from(elements).map(el => ({
          testId: el.getAttribute('data-testid'),
          text: el.textContent?.substring(0, 50),
          visible: (el as HTMLElement).offsetParent !== null
        }));
      });
      console.log('🏷️ All test IDs on page:', JSON.stringify(allTestIds, null, 2));

      // Check if we're on an error page
      const pageContent = await page.content();
      console.log('📄 Full page HTML (first 500 chars):', pageContent.substring(0, 500));
    }

    // The main assertion
    await expect(page.locator('[data-testid="auth-form-subtitle"]')).toContainText(
      'Sign in to continue',
      { timeout: 10000 }
    );

    console.log('✅ SUCCESS: Auth form found with correct text!');

    // Verify other auth elements are present
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-button"]')).toBeVisible();

    console.log('✅ All auth form elements present and visible');
  });

  test('environment variables are accessible', async ({ page }) => {
    console.log('🔧 Checking environment configuration...');

    await page.goto('/');

    // Check if Supabase client initializes
    const supabaseConfig = await page.evaluate(() => {
      return {
        hasSupabaseUrl: !!(window as any).import?.meta?.env?.VITE_SUPABASE_URL,
        hasSupabaseKey: !!(window as any).import?.meta?.env?.VITE_SUPABASE_ANON_KEY,
      };
    });

    console.log('📊 Supabase config detection:', supabaseConfig);

    // This is informational - doesn't fail the test
    console.log('ℹ️ Environment check complete');
  });
});
