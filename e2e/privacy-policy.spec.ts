
import { test, expect } from '@playwright/test';

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test-e2e@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

test.describe.skip('Privacy Policy Page', () => {
  test.use({
    // Require fresh session so login route stays accessible
    storageState: { cookies: [], origins: [] },
  })
test('@smoke should be accessible from the login page', async ({ page }) => {
    await page.goto('/login');

    // Find and click the privacy policy link
    await page.click('a:has-text("Privacy Policy")');

    // Verify the privacy policy page is loaded
    await expect(page).toHaveURL('/privacy');
    await expect(page.locator('h1:has-text("Datenschutzerklärung")')).toBeVisible();
  });

  test('should be accessible from the user profile dropdown', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD);
    await page.click('[data-testid="submit-button"]');
    await page.waitForURL('/');

    // Open the user profile dropdown
    await page.click('[data-testid="user-profile-button"]');

    // Find and click the privacy policy link
    await page.click('a:has-text("Privacy Policy")');

    // Verify the privacy policy page is loaded
    await expect(page).toHaveURL('/privacy');
    await expect(page.locator('h1:has-text("Datenschutzerklärung")')).toBeVisible();
  });
});
