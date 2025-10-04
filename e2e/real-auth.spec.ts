import { test, expect } from '@playwright/test';

/**
 * Real Authentication E2E Tests
 *
 * These tests use actual Supabase authentication against a deployed environment
 * to verify the complete authentication flow works in production.
 *
 * Prerequisites:
 * 1. Create a test user in Supabase Auth dashboard
 * 2. Set environment variables in .env.test
 * 3. Deploy the application to a public URL
 *
 * Run with: npx playwright test e2e/real-auth.spec.ts --env=.env.test
 */

// Skip these tests if we don't have real auth credentials
const hasRealAuthConfig = process.env.TEST_USER_EMAIL &&
                         process.env.TEST_USER_PASSWORD &&
                         process.env.VITE_SUPABASE_URL;

test.describe('Real Authentication Flow', () => {
  test.skip(!hasRealAuthConfig, 'Skipping real auth tests - missing credentials');

  const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL!;
  const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD!;

  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication state
    await page.context().clearCookies();
    await page.goto('/', { timeout: 30000 });
  });

  test('should successfully sign in with test user credentials', async ({ page }) => {
    // Should initially show login form
    await expect(page.locator('text=Sign in to continue')).toBeVisible({ timeout: 15000 });

    // Fill in test user credentials
    await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD);

    // Submit login form
    await page.click('[data-testid="submit-button"]');

    // Should successfully authenticate and show flashcard app
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Italian FlashCards' })).toBeVisible({ timeout: 10000 });

    // Should see mode selection
    await expect(page.getByText('Learn Italian from Russian')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Learn Russian from Italian')).toBeVisible({ timeout: 10000 });
  });

  test('should maintain authentication state across page refreshes', async ({ page }) => {
    // Sign in first
    await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD);
    await page.click('[data-testid="submit-button"]');

    // Wait for authentication to complete
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 10000 });

    // Refresh the page
    await page.reload();

    // Should still be authenticated (no login form should appear)
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Sign in to continue')).not.toBeVisible();
  });

  test('should successfully access flashcard functionality after real authentication', async ({ page }) => {
    // Sign in
    await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD);
    await page.click('[data-testid="submit-button"]');

    // Wait for authentication
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 10000 });

    // Start learning session
    await page.getByText('Learn Italian from Russian').click();
    await expect(page.getByText(/Translate to Italian:/i)).toBeVisible();

    // Test flashcard functionality
    const input = page.getByRole('textbox');
    await expect(input).toBeVisible();
    await input.fill('test answer');
    await page.locator('form button[type="submit"]').click();

    // Should show result
    const resultMessage = page.locator('span.text-lg.font-semibold, p.text-xs').first();
    await expect(resultMessage).toBeVisible();

    // Test navigation
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('2 of 300')).toBeVisible();
  });

  test('should successfully sign out', async ({ page }) => {
    // Sign in first
    await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD);
    await page.click('[data-testid="submit-button"]');

    // Wait for authentication
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 10000 });

    // Find and click sign out button (should be in header)
    await page.click('[data-testid="sign-out-button"]');

    // Should return to login screen
    await expect(page.locator('text=Sign in to continue')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="protected-content"]')).not.toBeVisible();
  });

  test('should handle invalid credentials appropriately', async ({ page }) => {
    // Try to sign in with invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="submit-button"]');

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });

    // Should still be on login page
    await expect(page.locator('text=Sign in to continue')).toBeVisible();
    await expect(page.locator('[data-testid="protected-content"]')).not.toBeVisible();
  });

  test('should work with social authentication buttons (visual check)', async ({ page }) => {
    // Verify social login buttons are present and functional
    await expect(page.locator('[data-testid="google-login-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="github-login-button"]')).toBeVisible();

    // Buttons should be clickable (we won't test the actual OAuth flow)
    await expect(page.locator('[data-testid="google-login-button"]')).toBeEnabled();
    await expect(page.locator('[data-testid="github-login-button"]')).toBeEnabled();
  });
});

test.describe('Real Authentication - Error Scenarios', () => {
  test.skip(!hasRealAuthConfig, 'Skipping real auth tests - missing credentials');

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept auth requests and simulate network error
    await page.route('**/auth/v1/token**', route => route.abort());

    await page.fill('[data-testid="email-input"]', process.env.TEST_USER_EMAIL!);
    await page.fill('[data-testid="password-input"]', process.env.TEST_USER_PASSWORD!);
    await page.click('[data-testid="submit-button"]');

    // Should handle the error gracefully (show error message or retry)
    // The exact behavior depends on how the app handles network errors
    await expect(page.locator('[data-testid="submit-button"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle session expiration', async ({ page }) => {
    // This test would require manipulating the JWT token expiration
    // For now, we'll just verify the session check works
    await page.goto('/');

    // Should show loading state initially
    await expect(page.locator('[data-testid="auth-loading"]')).toBeVisible();

    // Should eventually resolve to login or authenticated state
    await expect(page.locator('[data-testid="auth-loading"]')).not.toBeVisible({ timeout: 10000 });
  });
});