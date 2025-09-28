import { test, expect } from '@playwright/test';

// Test configuration for authentication tests
test.describe('Authentication Protection', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication state thoroughly
    await page.context().clearCookies();
    await page.context().clearPermissions();

    // Clear local storage and session storage
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    // Clear any cached service workers
    await page.evaluate(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }
    });

    // Navigate again to ensure clean state
    await page.goto('/');
  });

  test('should require authentication to access flashcards', async ({ page }) => {
    // Visit app without being logged in
    await page.goto('/');

    // Should see login form, not flashcards
    await expect(page.locator('text=Sign in to continue')).toBeVisible();
    await expect(page.locator('text=Italian Flashcards')).toBeVisible();
    await expect(page.locator('[data-testid="flashcard-app"]')).not.toBeVisible();

    // Should see login form elements
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-button"]')).toBeVisible();
  });

  test('should show loading state during authentication check', async ({ page }) => {
    // Intercept auth request to simulate delay
    await page.route('**/auth/session', async route => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });

    await page.goto('/');

    // Should show loading spinner initially
    await expect(page.locator('[data-testid="auth-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page.locator('text=Checking authentication...')).toBeVisible();
  });

  test('should toggle between sign in and sign up modes', async ({ page }) => {
    await page.goto('/');

    // Should start in sign in mode
    await expect(page.locator('text=Sign in to continue')).toBeVisible();
    await expect(page.locator('[data-testid="submit-button"]')).toContainText('Sign In');

    // Click toggle to sign up mode
    await page.click('[data-testid="toggle-auth-mode"]');

    // Should switch to sign up mode
    await expect(page.locator('text=Create your account')).toBeVisible();
    await expect(page.locator('[data-testid="submit-button"]')).toContainText('Create Account');

    // Click toggle back to sign in mode
    await page.click('[data-testid="toggle-auth-mode"]');

    // Should be back in sign in mode
    await expect(page.locator('text=Sign in to continue')).toBeVisible();
    await expect(page.locator('[data-testid="submit-button"]')).toContainText('Sign In');
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    // Mock authentication failure
    await page.route('**/auth/v1/token**', route =>
      route.fulfill({
        status: 400,
        body: JSON.stringify({
          error: 'Invalid login credentials',
          error_description: 'Invalid login credentials'
        })
      })
    );

    await page.goto('/');

    // Fill in invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="submit-button"]');

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should handle social login buttons', async ({ page }) => {
    await page.goto('/');

    // Should see social login buttons
    await expect(page.locator('[data-testid="google-login-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="github-login-button"]')).toBeVisible();

    // Buttons should be clickable (we won't actually test OAuth flow)
    await expect(page.locator('[data-testid="google-login-button"]')).toBeEnabled();
    await expect(page.locator('[data-testid="github-login-button"]')).toBeEnabled();
  });

  test('should show loading state during sign in attempt', async ({ page }) => {
    // Mock slow authentication
    await page.route('**/auth/v1/token**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.goto('/');

    // Fill in credentials
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');

    // Click submit
    await page.click('[data-testid="submit-button"]');

    // Should show loading state in button
    await expect(page.locator('[data-testid="submit-button"] [data-testid="loading-spinner"]')).toBeVisible();
  });

  test('should handle password visibility toggle', async ({ page }) => {
    await page.goto('/');

    const passwordInput = page.locator('[data-testid="password-input"]');
    const toggleButton = page.locator('button:has([class*="eye"])').first();

    // Password should be hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle to hide password again
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/');

    // Try to submit empty form
    await page.click('[data-testid="submit-button"]');

    // Browser should prevent submission (HTML5 validation)
    // The form should still be visible
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
  });

  test('should maintain form state when switching between sign in/up', async ({ page }) => {
    await page.goto('/');

    // Fill in email (should persist across mode changes)
    await page.fill('[data-testid="email-input"]', 'test@example.com');

    // Switch to sign up mode
    await page.click('[data-testid="toggle-auth-mode"]');

    // Email should still be filled
    await expect(page.locator('[data-testid="email-input"]')).toHaveValue('test@example.com');

    // Switch back to sign in mode
    await page.click('[data-testid="toggle-auth-mode"]');

    // Email should still be filled
    await expect(page.locator('[data-testid="email-input"]')).toHaveValue('test@example.com');
  });
});

// Tests for authenticated state (would require actual authentication setup)
test.describe('Authenticated State', () => {
  test.skip('should access flashcards after successful login', async ({ page }) => {
    // This test would require actual Supabase test credentials
    // For now, we'll skip it and focus on protection tests

    await page.goto('/');

    // Mock successful authentication
    await page.route('**/auth/v1/token**', route =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          access_token: 'mock-token',
          user: { email: 'test@example.com' }
        })
      })
    );

    // Fill credentials and submit
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="submit-button"]');

    // Should see flashcard app
    await expect(page.locator('[data-testid="flashcard-app"]')).toBeVisible();
    await expect(page.locator('text=Mode Selection')).toBeVisible();
  });

  test.skip('should show sign out button when authenticated', async ({ page }) => {
    // This test would require actual authentication
    // For now, we'll skip it

    // After successful login, should see sign out button
    await expect(page.locator('[data-testid="sign-out-button"]')).toBeVisible();
  });

  test.skip('should redirect to login after sign out', async ({ page }) => {
    // This test would require actual authentication
    // For now, we'll skip it

    // Click sign out
    await page.click('[data-testid="sign-out-button"]');

    // Should be redirected to login
    await expect(page.locator('text=Sign in to continue')).toBeVisible();
  });
});