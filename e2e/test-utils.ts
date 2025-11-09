import { Page, expect } from '@playwright/test';

/**
 * Utility functions for E2E tests with authentication
 */

/**
 * Waits for the app to be fully loaded and authenticated in test mode
 * This function handles the authentication bypass and ensures the app is ready
 */
export async function waitForAppReady(page: Page) {
  // Wait for the protected content to be visible (indicates auth bypass worked)
  await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 10000 });

  // Additional wait to ensure all components are properly mounted
  await page.waitForTimeout(500);
}

/**
 * Navigates to the home page and waits for it to be ready
 */
export async function goToHomePage(page: Page) {
  await page.goto('/?test-mode=true');
  await waitForAppReady(page);
}

/**
 * Starts a learning session by selecting a mode
 * @param page - Playwright page object
 * @param mode - 'ru-it' for Russian to Italian, 'it-ru' for Italian to Russian
 */
export async function startLearningSession(page: Page, mode: 'ru-it' | 'it-ru' = 'ru-it') {
  await goToHomePage(page);

  const buttonText = mode === 'ru-it'
    ? 'Learn Italian from Russian'
    : 'Learn Russian from Italian';

  await page.getByText(buttonText).click();

  // Wait for flashcard interface to load
  const expectText = mode === 'ru-it'
    ? /Translate to Italian:/i
    : /Translate to Russian:/i;

  await expect(page.getByText(expectText)).toBeVisible();
}

/**
 * Waits for a flashcard to be fully loaded and visible
 */
export async function waitForFlashcard(page: Page) {
  // Wait for the input field to be visible and enabled
  await expect(page.getByRole('textbox')).toBeVisible();
  await expect(page.getByRole('textbox')).toBeEnabled();

  // Wait for card counter to be visible
  await expect(page.getByText(/\d+ of \d+/)).toBeVisible();
}

/**
 * Submits an answer in a flashcard
 * @param page - Playwright page object
 * @param answer - The answer to submit
 */
export async function submitAnswer(page: Page, answer: string) {
  const input = page.getByRole('textbox');
  await input.fill(answer);
  await page.locator('form button[type="submit"]').click();

  // Wait for result to appear
  const resultMessage = page.locator('span.text-lg.font-semibold, p.text-xs').first();
  await expect(resultMessage).toBeVisible();
}

/**
 * Navigates to the next flashcard
 */
export async function goToNextCard(page: Page) {
  await page.getByRole('button', { name: 'Next' }).click();
  await waitForFlashcard(page);
}

/**
 * Navigates to the previous flashcard
 */
export async function goToPreviousCard(page: Page) {
  await page.getByRole('button', { name: 'Previous' }).click();
  await waitForFlashcard(page);
}

/**
 * Gets the current card number from the UI
 * @param page - Playwright page object
 * @returns Promise resolving to the current card number
 */
export async function getCurrentCardNumber(page: Page): Promise<number> {
  const cardCounter = page.getByText(/\d+ of \d+/);
  const text = await cardCounter.textContent();
  const match = text?.match(/(\d+) of \d+/);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * Waits for a specific card number to be displayed
 * @param page - Playwright page object
 * @param cardNumber - Expected card number
 */
export async function waitForCardNumber(page: Page, cardNumber: number) {
  await expect(page.getByText(`${cardNumber} of 300`)).toBeVisible();
}

/**
 * Clicks a header button by its title attribute
 * @param page - Playwright page object
 * @param title - The title attribute of the button to click
 */
export async function clickHeaderButton(page: Page, title: string) {
  await page.locator(`button[title="${title}"]`).click();
}

/**
 * Toggles the learning direction (Russian ↔ Italian)
 */
export async function toggleLearningDirection(page: Page) {
  await clickHeaderButton(page, 'Toggle learning direction (Ctrl+T)');
}

/**
 * Restarts the learning session
 */
export async function restartSession(page: Page) {
  await clickHeaderButton(page, 'Restart session (Ctrl+R)');
  await waitForCardNumber(page, 1);
}

/**
 * Toggles shuffle mode
 */
export async function toggleShuffle(page: Page) {
  await clickHeaderButton(page, 'Toggle shuffle mode (Ctrl+S)');
}

/**
 * Checks if the mode selection screen is visible
 */
export async function expectModeSelection(page: Page) {
  await expect(page.getByRole('heading', { name: 'Italian FlashCards' })).toBeVisible();
  await expect(page.getByText('Learn Italian from Russian')).toBeVisible();
  await expect(page.getByText('Learn Russian from Italian')).toBeVisible();
}

/**
 * Checks if the flashcard interface is visible
 * @param mode - Expected learning mode
 */
export async function expectFlashcardInterface(page: Page, mode: 'ru-it' | 'it-ru' = 'ru-it') {
  const expectText = mode === 'ru-it'
    ? /Translate to Italian:/i
    : /Translate to Russian:/i;

  await expect(page.getByText(expectText)).toBeVisible();
  await expect(page.getByRole('textbox')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible();
}

/**
 * Helper to check that test authentication is working
 */
export async function verifyTestAuthenticationActive(page: Page) {
  // Check that we can see the protected content
  await expect(page.locator('[data-testid="protected-content"]')).toBeVisible();

  // Check that we're not seeing the login form
  await expect(page.locator('text=Sign in to continue')).not.toBeVisible();

  // Check for test mode indicator in console (optional)
  const logs = await page.evaluate(() => {
    type TestWindow = typeof window & { __testLogs?: string[] };
    const testWindow = window as TestWindow;
    return testWindow.__testLogs ?? [];
  });

  // If test mode logs are available, verify them
  if (logs.length > 0) {
    const hasTestModeLog = logs.some((log: string) => log.includes('Test mode: Using mock authentication'));
    expect(hasTestModeLog).toBe(true);
  }
}
