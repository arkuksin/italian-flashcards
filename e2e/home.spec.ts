import { test, expect } from '@playwright/test';

test.describe('Italian Flashcards App', () => {
  test('homepage displays mode selection', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/Italian Flashcard Learning App/i);

    // Check main heading
    await expect(page.getByRole('heading', { name: 'Italian FlashCards' })).toBeVisible();

    // Check for mode selection buttons with specific text content
    await expect(page.getByText('Learn Italian from Russian')).toBeVisible();
    await expect(page.getByText('Learn Russian from Italian')).toBeVisible();

    // Check the actual button structure (using first() to avoid strict mode violations)
    await expect(page.getByText('Русский').first()).toBeVisible();
    await expect(page.getByText('Italiano').first()).toBeVisible();
  });

  test('can start learning session', async ({ page }) => {
    await page.goto('/');

    // Start a learning session by clicking the first mode button
    await page.getByText('Learn Italian from Russian').click();

    // Should navigate to flashcard interface
    await expect(page.getByText(/Translate to Italian:/i)).toBeVisible();
    await expect(page.getByRole('textbox')).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveAttribute('placeholder', 'Type your translation...');
  });

  test('flashcard interface works correctly', async ({ page }) => {
    await page.goto('/');

    // Start learning session
    await page.getByText('Learn Italian from Russian').click();

    // Wait for flashcard to load
    await expect(page.getByText(/Translate to Italian:/i)).toBeVisible();

    // Type an answer
    const input = page.getByRole('textbox');
    await input.fill('test answer');

    // Submit answer using the form submit button (the blue one with Send icon)
    await page.locator('form button[type="submit"]').click();

    // Should show result (correct/incorrect)
    await expect(page.getByText(/Correct|Not quite right/i)).toBeVisible();

    // Should show the correct answer
    await expect(page.getByText('Correct answer:')).toBeVisible();

    // Should have navigation buttons
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible();
  });

  test('navigation between flashcards works', async ({ page }) => {
    await page.goto('/');

    // Start learning session
    await page.getByText('Learn Italian from Russian').click();

    // Wait for first flashcard
    await expect(page.getByText(/Translate to Italian:/i)).toBeVisible();

    // Check we're on card 1
    await expect(page.getByText('1 of 300')).toBeVisible();

    // Go to next card
    await page.getByRole('button', { name: 'Next' }).click();

    // Check we're on card 2
    await expect(page.getByText('2 of 300')).toBeVisible();

    // Go back to previous card
    await page.getByRole('button', { name: 'Previous' }).click();

    // Check we're back on card 1
    await expect(page.getByText('1 of 300')).toBeVisible();
  });

  test('displays keyboard shortcuts help', async ({ page }) => {
    await page.goto('/');

    // Start learning session
    await page.getByText('Learn Italian from Russian').click();

    // Check for keyboard shortcuts help
    await expect(page.getByText(/Use.*to navigate.*Enter.*to submit/)).toBeVisible();
  });

  test('mode selection displays features', async ({ page }) => {
    await page.goto('/');

    // Check for feature descriptions
    await expect(page.getByText('Full Keyboard Support')).toBeVisible();
    await expect(page.getByText('Progress Tracking')).toBeVisible();
    await expect(page.getByText('Beautiful Design')).toBeVisible();

    // Check feature details
    await expect(page.getByText('Navigate with arrow keys, submit with Enter')).toBeVisible();
    await expect(page.getByText('Monitor accuracy, streaks, and completion')).toBeVisible();
    await expect(page.getByText('Dark mode, animations, and smooth UX')).toBeVisible();
  });
});