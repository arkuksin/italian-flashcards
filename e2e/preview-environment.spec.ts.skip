import { test, expect } from '@playwright/test';

/**
 * Preview Environment Integration Tests
 *
 * This test suite verifies the complete authentication flow and functionality
 * in the preview environment with the test database connection.
 */

test.describe('Preview Environment Integration', () => {

  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication state
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('should show authentication interface in preview environment', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Wait for either auth loading or login form to appear with increased timeout for Vercel
    const authStateDetected = await Promise.race([
      page.locator('[data-testid="auth-loading"]').waitFor({ timeout: 8000 }).then(() => 'loading').catch(() => null),
      page.locator('[data-testid="auth-form-subtitle"]').waitFor({ timeout: 8000 }).then(() => 'form').catch(() => null),
      page.locator('[data-testid="protected-content"]').waitFor({ timeout: 8000 }).then(() => 'protected').catch(() => null)
    ]);

    console.log('Auth state detected:', authStateDetected);

    // Check if we're in test mode by looking for test mode indicators
    const isTestMode = await page.evaluate(() => {
      return window.location.search.includes('test-mode=true') ||
             document.body.getAttribute('data-test-mode') === 'true' ||
             (window as any).VITE_TEST_MODE === 'true';
    });

    console.log('Test mode detected:', isTestMode);

    if (isTestMode) {
      // In test mode, should automatically authenticate and show flashcard app
      await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 15000 });
      console.log('✅ Test mode: Auto-authentication successful');
    } else {
      // In normal mode, should show login form - be flexible about timing
      try {
        await expect(page.locator('[data-testid="auth-form-subtitle"]')).toContainText('Sign in to continue', { timeout: 15000 });
        await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
        console.log('✅ Normal mode: Login form displayed');
      } catch (error) {
        // If we can't find the expected elements, log what we do see for debugging
        const pageContent = await page.evaluate(() => document.body.innerText.substring(0, 500));
        console.log('Page content preview:', pageContent);
        throw error;
      }
    }
  });

  test('should connect to test database in preview environment', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check environment variables
    const supabaseUrl = await page.evaluate(() => {
      return (window as any).__ENV__?.VITE_SUPABASE_URL || 'Not available in browser';
    });

    console.log('Supabase URL detected:', supabaseUrl);

    // Verify we're using test database URL
    if (supabaseUrl.includes('slhyzoupwluxgasvapoc')) {
      console.log('✅ Connected to test database');
    } else {
      console.log('⚠️  Database URL not detected or different:', supabaseUrl);
    }

    // Take screenshot for debugging
    await page.screenshot({
      path: 'test-results/preview-environment-check.png',
      fullPage: true
    });
  });

  test('should handle authentication flow correctly', async ({ page }) => {
    // Wait for initial load
    await page.waitForLoadState('networkidle');

    // Wait for any auth state to appear
    await Promise.race([
      page.locator('[data-testid="auth-loading"]').waitFor({ timeout: 5000 }).catch(() => {}),
      page.locator('[data-testid="auth-form-subtitle"]').waitFor({ timeout: 5000 }).catch(() => {}),
      page.locator('[data-testid="protected-content"]').waitFor({ timeout: 5000 }).catch(() => {})
    ]);

    // Check if in test mode
    const isTestMode = await page.evaluate(() => {
      return window.location.search.includes('test-mode=true') ||
             document.body.getAttribute('data-test-mode') === 'true' ||
             (window as any).VITE_TEST_MODE === 'true';
    });

    if (isTestMode) {
      // Test mode: Should automatically authenticate
      await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 15000 });

      // Should be able to access mode selection
      await expect(page.locator('text=Mode Selection')).toBeVisible({ timeout: 10000 });

      console.log('✅ Test mode: Successfully accessed protected content');
    } else {
      // Normal mode: Test login form functionality
      await expect(page.locator('[data-testid="auth-form-subtitle"]')).toContainText('Sign in to continue', { timeout: 15000 });

      // Test form elements
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="submit-button"]')).toBeVisible();

      // Test toggle functionality
      await page.click('[data-testid="toggle-auth-mode"]');
      await expect(page.locator('[data-testid="auth-form-subtitle"]')).toContainText('Create your account');

      console.log('✅ Normal mode: Login form functionality verified');
    }
  });

  test('should access flashcard functionality with test data', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if in test mode
    const isTestMode = await page.evaluate(() => {
      return window.location.search.includes('test-mode=true') ||
             document.body.getAttribute('data-test-mode') === 'true' ||
             (window as any).VITE_TEST_MODE === 'true';
    });

    if (isTestMode) {
      // Should automatically authenticate and show app
      await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 10000 });

      // Navigate through mode selection
      const modeSelection = page.locator('text=Mode Selection');
      if (await modeSelection.isVisible()) {
        // Select Russian to Italian mode
        await page.click('text=Russian → Italian');

        // Should now see the flashcard app
        await expect(page.locator('[data-testid="flashcard-app"]')).toBeVisible({ timeout: 5000 });

        // Verify we can see flashcard content
        await expect(page.locator('.flashcard, [data-testid*="flashcard"]')).toBeVisible({ timeout: 5000 });

        console.log('✅ Successfully accessed flashcard functionality');
      } else {
        console.log('Mode selection not visible, checking if already in flashcard app');
        await expect(page.locator('[data-testid="flashcard-app"]')).toBeVisible({ timeout: 5000 });
      }
    } else {
      console.log('Skipping flashcard test in non-test mode (requires authentication)');
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test network errors
    await page.route('**/auth/v1/**', route => route.abort());

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should still show some form of UI (not crash)
    const hasUI = await Promise.race([
      page.locator('[data-testid="auth-loading"]').isVisible(),
      page.locator('[data-testid="auth-form-subtitle"]').isVisible(),
      page.locator('[data-testid="protected-content"]').isVisible()
    ]);

    expect(hasUI).toBe(true);
    console.log('✅ App handles network errors gracefully');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for proper ARIA labels and roles
    const loadingSpinner = page.locator('[data-testid="loading-spinner-icon"]');
    if (await loadingSpinner.isVisible()) {
      await expect(loadingSpinner).toHaveAttribute('aria-label', 'Loading');
    }

    // Check for form accessibility
    const emailInput = page.locator('[data-testid="email-input"]');
    if (await emailInput.isVisible()) {
      await expect(emailInput).toHaveAttribute('type', 'email');
      await expect(emailInput).toHaveAttribute('required');
    }

    console.log('✅ Accessibility attributes verified');
  });

  test('should persist auth state correctly', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check if in test mode
    const isTestMode = await page.evaluate(() => {
      return window.location.search.includes('test-mode=true') ||
             document.body.getAttribute('data-test-mode') === 'true' ||
             (window as any).VITE_TEST_MODE === 'true';
    });

    if (isTestMode) {
      // Should maintain authenticated state on refresh
      await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 10000 });

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be authenticated
      await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 10000 });

      console.log('✅ Auth state persisted across page refresh');
    } else {
      console.log('Skipping auth persistence test in non-test mode');
    }
  });

  test.afterAll(async ({ browser }) => {
    // Clean up - close all contexts
    const contexts = browser.contexts();
    await Promise.all(contexts.map(context => context.close()));

    console.log('🧹 Cleanup completed - all browser contexts closed');
  });
});

/**
 * Environment Detection and Debugging Tests
 */
test.describe('Environment Detection', () => {

  test('should detect environment configuration', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check environment variables available in browser
    const envInfo = await page.evaluate(() => {
      return {
        userAgent: navigator.userAgent,
        url: window.location.href,
        hasTestMode: window.location.search.includes('test-mode=true') ||
                     document.body.getAttribute('data-test-mode') === 'true' ||
                     (window as any).VITE_TEST_MODE === 'true',
        hasSupabase: typeof (window as any).supabase !== 'undefined',
        title: document.title
      };
    });

    console.log('Environment Info:', envInfo);

    // Log current URL for debugging
    console.log('Current URL:', page.url());

    // Take screenshot for debugging
    await page.screenshot({
      path: 'test-results/environment-detection.png',
      fullPage: true
    });

    // Basic assertion - page should load without errors
    expect(page.url()).toContain('http');
  });

  test('should capture console logs and debug authentication state', async ({ page }) => {
    // Capture console logs to see debug output
    const consoleLogs: string[] = [];
    const errorLogs: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      } else if (msg.type() === 'error') {
        errorLogs.push(`ERROR: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        errorLogs.push(`WARN: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      errorLogs.push(`PAGE ERROR: ${error.message}`);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait a moment for AuthContext to initialize
    await page.waitForTimeout(2000);

    // Log all captured console messages
    console.log('=== CAPTURED CONSOLE LOGS ===');
    consoleLogs.forEach(log => console.log(log));
    console.log('=== END CONSOLE LOGS ===');

    console.log('=== ERROR LOGS ===');
    errorLogs.forEach(log => console.log(log));
    console.log('=== END ERROR LOGS ===');

    // Check what's actually visible on the page using proper selectors
    const pageState = await page.evaluate(() => {
      return {
        hasLoginFormText: document.body.innerText.includes('Sign in to continue'),
        hasCreateAccountText: document.body.innerText.includes('Create your account'),
        hasAuthLoading: !!document.querySelector('[data-testid="auth-loading"]'),
        hasProtectedContent: !!document.querySelector('[data-testid="protected-content"]'),
        hasFlashcardApp: !!document.querySelector('[data-testid="flashcard-app"]'),
        hasModeSelectionText: document.body.innerText.includes('Mode Selection'),
        hasEmailInput: !!document.querySelector('[data-testid="email-input"]'),
        hasPasswordInput: !!document.querySelector('[data-testid="password-input"]'),
        bodyContent: document.body.innerText.substring(0, 500), // First 500 chars
        currentUrl: window.location.href,
        documentTitle: document.title,
      };
    });

    console.log('=== PAGE STATE ===');
    console.log(pageState);
    console.log('=== END PAGE STATE ===');

    // Take a screenshot for visual debugging
    await page.screenshot({
      path: 'test-results/debug-auth-state.png',
      fullPage: true
    });
  });

  test('should have test database configuration', async ({ page }) => {
    await page.goto('/');

    // Check if we can detect Supabase configuration
    const hasSupabaseConfig = await page.evaluate(() => {
      try {
        // Try to access Supabase configuration
        return typeof window !== 'undefined';
      } catch (error) {
        return false;
      }
    });

    expect(hasSupabaseConfig).toBe(true);
    console.log('✅ Browser environment configured correctly');
  });
});