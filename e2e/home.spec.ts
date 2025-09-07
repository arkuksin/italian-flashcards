import { test, expect } from '@playwright/test';

test('homepage displays mode selection', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Italian Flashcard Learning App/i);
  await expect(page.getByRole('heading', { name: 'Italian FlashCards' })).toBeVisible();
});
