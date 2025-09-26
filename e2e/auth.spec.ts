import { test, expect } from '@playwright/test';

test.describe('Authentication Context Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Application loads successfully with AuthProvider', async ({ page }) => {
    // The app should load without errors, indicating AuthProvider is working
    await expect(page.getByRole('heading', { name: 'Italian FlashCards' })).toBeVisible();

    // Should display mode selection
    await expect(page.getByText('Learn Italian from Russian')).toBeVisible();
    await expect(page.getByText('Learn Russian from Italian')).toBeVisible();
  });

  test('Can navigate to flashcard interface with auth context', async ({ page }) => {
    // Start learning session - this verifies auth context doesn't interfere
    await page.getByText('Learn Italian from Russian').click();
    await expect(page.getByText(/Translate to Italian:/i)).toBeVisible();

    // Verify input field is present
    await expect(page.getByRole('textbox')).toBeVisible();
  });

  test('Core flashcard functionality works with auth context', async ({ page }) => {
    // Test that flashcard features work correctly with auth integration
    await page.getByText('Learn Italian from Russian').click();
    await expect(page.getByText(/Translate to Italian:/i)).toBeVisible();

    // Test input and submission
    const input = page.getByRole('textbox');
    await input.fill('test');
    await page.locator('form button[type="submit"]').click();

    // Should show result
    const resultMessage = page.locator('span.text-lg.font-semibold, p.text-xs').first();
    await expect(resultMessage).toBeVisible();

    // Test navigation between cards
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('2 of 300')).toBeVisible();

    await page.getByRole('button', { name: 'Previous' }).click();
    await expect(page.getByText('1 of 300')).toBeVisible();
  });

  test('No auth-related errors break the application', async ({ page }) => {
    // Monitor for critical auth errors that would break functionality
    const criticalErrors: string[] = [];
    page.on('pageerror', (error) => {
      if (error.message.includes('useAuth must be used within') ||
          error.message.includes('AuthProvider') ||
          error.message.includes('Context')) {
        criticalErrors.push(error.message);
      }
    });

    // Navigate through the app
    await page.getByText('Learn Italian from Russian').click();
    await expect(page.getByText(/Translate to Italian:/i)).toBeVisible();

    // Use various app features
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Restart' }).click();

    // Wait for the mode selection screen to appear after restart
    await expect(page.getByText('Learn Russian from Italian')).toBeVisible();
    await page.getByText('Learn Russian from Italian').click();

    // No critical auth context errors should occur
    expect(criticalErrors).toHaveLength(0);
  });
});