import { test, expect } from '@playwright/test';

/**
 * Deployment Authentication Check
 *
 * This test verifies that the deployed environment is properly configured
 * for real authentication testing.
 */

test.describe('Deployment Authentication Configuration', () => {
  test('deployed app should be in production mode (not test mode)', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if we're in test mode (should NOT be)
    const isTestMode = await page.evaluate(() => {
      return window.location.search.includes('test=true') ||
             document.body.getAttribute('data-test-mode') === 'true' ||
             (window as any).VITE_PLAYWRIGHT_TEST === 'true';
    });

    // In production, we should see a login form, not direct access to flashcards
    const hasLoginForm = await page.locator('text=Sign in').count() > 0;
    const hasFlashcardContent = await page.locator('[data-testid="protected-content"]').count() > 0;

    console.log('Test mode detected:', isTestMode);
    console.log('Has login form:', hasLoginForm);
    console.log('Has flashcard content (should be false in prod):', hasFlashcardContent);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/deployment-mode-check.png', fullPage: true });

    // Assertions for production mode
    expect(isTestMode).toBe(false);
    expect(hasLoginForm).toBe(true);
    expect(hasFlashcardContent).toBe(false);
  });

  test('deployed app should show authentication interface', async ({ page }) => {
    await page.goto('/');

    // Should show some form of authentication UI
    const authIndicators = [
      page.locator('text=Sign in'),
      page.locator('text=Login'),
      page.locator('text=Sign in to continue'),
      page.locator('[data-testid="email-input"]'),
      page.locator('input[type="email"]'),
      page.locator('form')
    ];

    let hasAuthUI = false;
    for (const indicator of authIndicators) {
      const count = await indicator.count();
      if (count > 0) {
        hasAuthUI = true;
        console.log('Found auth UI element:', await indicator.first().textContent());
        break;
      }
    }

    expect(hasAuthUI).toBe(true);
  });

  test('deployed app should not show protected content without authentication', async ({ page }) => {
    await page.goto('/');

    // Should NOT immediately show protected content
    const protectedElements = [
      page.locator('[data-testid="protected-content"]'),
      page.locator('text=Italian FlashCards'),
      page.locator('text=Learn Italian from Russian'),
      page.locator('text=Learn Russian from Italian')
    ];

    for (const element of protectedElements) {
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        console.log('ERROR: Protected content is visible without auth:', await element.textContent());
      }
      expect(isVisible).toBe(false);
    }
  });
});