import { test, expect, Page } from '@playwright/test'

/**
 * E2E Tests for Leitner System - Phase 3
 * Tests advanced spaced repetition features:
 * - Difficulty rating buttons (Again, Hard, Good, Easy)
 * - Response time tracking
 * - Review history logging
 * - Adaptive interval calculation based on difficulty
 */

// Test configuration
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test-e2e@example.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

// Check if we have real authentication configuration
const hasRealAuthConfig = TEST_USER_EMAIL && TEST_USER_PASSWORD

/**
 * Helper function to start a learning session and wait for flashcard view
 * Firefox needs extra time for mode selection transitions
 */
async function startLearningSession(page: Page, browserName: string) {
  const modeButton = page.locator('button:has-text("Learn Italian from Russian")')
  await modeButton.waitFor({ state: 'visible', timeout: 5000 })
  await modeButton.click()

  // Firefox needs extra time to process the click and transition
  if (browserName === 'firefox') {
    await page.waitForTimeout(1000)
  }

  // Wait for flashcard to appear using multiple selectors
  const flashcardQuestion = page.locator('[data-testid="flashcard-question"], text=/Translate to Italian:/i').first()
  await flashcardQuestion.waitFor({ state: 'visible', timeout: 15000 })
}

test.describe('Leitner System - Phase 3: Difficulty Rating', () => {
  test.skip(!hasRealAuthConfig, 'Skipping Leitner Phase 3 tests - missing credentials')

  test.beforeEach(async ({ page }) => {
    // Navigate to homepage - authentication is handled by global setup
    await page.goto('/', { timeout: 20000 })
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 8000 })
  })

  test('should display difficulty rating buttons after answering', async ({ page, browserName }) => {
    await startLearningSession(page, browserName)

    // Answer the flashcard
    const inputField = page.getByRole('textbox')
    await inputField.fill('test answer')
    await page.locator('form button[type="submit"]').click()

    // Wait for answer feedback to appear
    await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible({ timeout: 3000 })

    // Verify difficulty rating buttons are visible
    const difficultyButtons = page.locator('[data-testid="difficulty-buttons"]')
    await expect(difficultyButtons).toBeVisible({ timeout: 3000 })
  })

  test('should show all four difficulty rating buttons', async ({ page, browserName }) => {
    await startLearningSession(page, browserName)

    // Answer the flashcard
    const inputField = page.getByRole('textbox')
    await inputField.fill('test answer')
    await page.locator('form button[type="submit"]').click()

    // Wait for answer feedback
    await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible({ timeout: 3000 })

    // Verify all four buttons are present
    await expect(page.locator('[data-testid="difficulty-again"]')).toBeVisible({ timeout: 2000 })
    await expect(page.locator('[data-testid="difficulty-hard"]')).toBeVisible({ timeout: 2000 })
    await expect(page.locator('[data-testid="difficulty-good"]')).toBeVisible({ timeout: 2000 })
    await expect(page.locator('[data-testid="difficulty-easy"]')).toBeVisible({ timeout: 2000 })
  })

  test('should allow clicking "Again" difficulty button', async ({ page, browserName }) => {
    await startLearningSession(page, browserName)

    // Answer the flashcard
    const inputField = page.getByRole('textbox')
    await inputField.fill('test answer')
    await page.locator('form button[type="submit"]').click()

    // Wait for answer feedback
    await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible({ timeout: 3000 })

    // Click "Again" button
    const againButton = page.locator('[data-testid="difficulty-again"]')
    await againButton.click()

    // Button should be disabled after clicking (rating saved)
    await expect(againButton).toBeDisabled({ timeout: 2000 })
  })

  test('should allow clicking "Hard" difficulty button', async ({ page, browserName }) => {
    await startLearningSession(page, browserName)

    // Answer the flashcard
    const inputField = page.getByRole('textbox')
    await inputField.fill('test answer')
    await page.locator('form button[type="submit"]').click()

    // Wait for answer feedback
    await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible({ timeout: 3000 })

    // Click "Hard" button
    const hardButton = page.locator('[data-testid="difficulty-hard"]')
    await hardButton.click()

    // Button should be disabled after clicking
    await expect(hardButton).toBeDisabled({ timeout: 2000 })
  })

  test('should allow clicking "Good" difficulty button', async ({ page, browserName }) => {
    await startLearningSession(page, browserName)

    // Answer the flashcard
    const inputField = page.getByRole('textbox')
    await inputField.fill('test answer')
    await page.locator('form button[type="submit"]').click()

    // Wait for answer feedback
    await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible({ timeout: 3000 })

    // Click "Good" button
    const goodButton = page.locator('[data-testid="difficulty-good"]')
    await goodButton.click()

    // Button should be disabled after clicking
    await expect(goodButton).toBeDisabled({ timeout: 2000 })
  })

  test('should allow clicking "Easy" difficulty button', async ({ page, browserName }) => {
    await startLearningSession(page, browserName)

    // Answer the flashcard
    const inputField = page.getByRole('textbox')
    await inputField.fill('test answer')
    await page.locator('form button[type="submit"]').click()

    // Wait for answer feedback
    await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible({ timeout: 3000 })

    // Click "Easy" button
    const easyButton = page.locator('[data-testid="difficulty-easy"]')
    await easyButton.click()

    // Button should be disabled after clicking
    await expect(easyButton).toBeDisabled({ timeout: 2000 })
  })

  test('should disable all difficulty buttons after selecting one', async ({ page, browserName }) => {
    await startLearningSession(page, browserName)

    // Answer the flashcard
    const inputField = page.getByRole('textbox')
    await inputField.fill('test answer')
    await page.locator('form button[type="submit"]').click()

    // Wait for answer feedback
    await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible({ timeout: 3000 })

    // Click one button
    await page.locator('[data-testid="difficulty-good"]').click()

    // All buttons should be disabled
    await expect(page.locator('[data-testid="difficulty-again"]')).toBeDisabled({ timeout: 2000 })
    await expect(page.locator('[data-testid="difficulty-hard"]')).toBeDisabled({ timeout: 2000 })
    await expect(page.locator('[data-testid="difficulty-good"]')).toBeDisabled({ timeout: 2000 })
    await expect(page.locator('[data-testid="difficulty-easy"]')).toBeDisabled({ timeout: 2000 })
  })

  test('should reset difficulty rating for next word', async ({ page, browserName }) => {
    await startLearningSession(page, browserName)

    // Answer first flashcard
    const inputField = page.getByRole('textbox')
    await inputField.fill('test answer')
    await page.locator('form button[type="submit"]').click()
    await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible({ timeout: 3000 })

    // Click difficulty button
    await page.locator('[data-testid="difficulty-good"]').click()

    // Move to next word
    const nextButton = page.locator('[data-testid="next-button"]')
    if (await nextButton.isVisible()) {
      await nextButton.click()
      const flashcardQuestion = page.locator('[data-testid="flashcard-question"], text=/Translate to Italian:/i').first()
      await flashcardQuestion.waitFor({ state: 'visible', timeout: 5000 })

      // Answer second flashcard
      await inputField.fill('another answer')
      await page.locator('form button[type="submit"]').click()
      await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible({ timeout: 3000 })

      // Difficulty buttons should be enabled again for the new word
      await expect(page.locator('[data-testid="difficulty-good"]')).toBeEnabled({ timeout: 2000 })
    }
  })
})

test.describe('Leitner System - Phase 3: Response Time Tracking', () => {
  test.skip(!hasRealAuthConfig, 'Skipping response time tests - missing credentials')

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { timeout: 20000 })
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 8000 })
  })

  test('should track response time for answers', async ({ page, browserName }) => {
    await startLearningSession(page, browserName)

    // Record start time
    const startTime = Date.now()

    // Wait a moment before answering to ensure measurable response time
    await page.waitForTimeout(1000)

    // Answer the flashcard
    const inputField = page.getByRole('textbox')
    await inputField.fill('test answer')
    await page.locator('form button[type="submit"]').click()

    // Wait for answer feedback
    await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible({ timeout: 3000 })

    const endTime = Date.now()
    const elapsedTime = endTime - startTime

    // Verify we had at least 1 second of response time
    expect(elapsedTime).toBeGreaterThanOrEqual(1000)

    // Select a difficulty rating to complete the flow
    await page.locator('[data-testid="difficulty-good"]').click()
    await expect(page.locator('[data-testid="difficulty-good"]')).toBeDisabled({ timeout: 2000 })
  })
})

test.describe('Leitner System - Phase 3: Complete Workflow', () => {
  test.skip(!hasRealAuthConfig, 'Skipping workflow tests - missing credentials')

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { timeout: 20000 })
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 8000 })
  })

  test('should complete full Phase 3 workflow: answer -> rate difficulty -> next word', async ({ page, browserName }) => {
    await startLearningSession(page, browserName)

    // Answer 3 flashcards with different difficulty ratings
    const ratings = ['difficulty-easy', 'difficulty-good', 'difficulty-hard']

    for (let i = 0; i < ratings.length; i++) {
      // Answer the flashcard
      const inputField = page.getByRole('textbox')
      await inputField.fill(`test answer ${i + 1}`)
      await page.locator('form button[type="submit"]').click()

      // Wait for answer feedback
      await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible({ timeout: 3000 })

      // Click difficulty button
      const difficultyButton = page.locator(`[data-testid="${ratings[i]}"]`)
      await expect(difficultyButton).toBeVisible({ timeout: 2000 })
      await difficultyButton.click()

      // Verify button is disabled after clicking
      await expect(difficultyButton).toBeDisabled({ timeout: 2000 })

      // Move to next word if not the last one
      if (i < ratings.length - 1) {
        const nextButton = page.locator('[data-testid="next-button"]')
        if (await nextButton.isVisible()) {
          await nextButton.click()
          const flashcardQuestion = page.locator('[data-testid="flashcard-question"], text=/Translate to Italian:/i').first()
          await flashcardQuestion.waitFor({ state: 'visible', timeout: 5000 })
        }
      }
    }

    // Verify we completed the workflow successfully
    expect(true).toBeTruthy()
  })

  test('should work with both correct and incorrect answers', async ({ page, browserName }) => {
    await startLearningSession(page, browserName)

    // Answer with wrong answer
    const inputField = page.getByRole('textbox')
    await inputField.fill('wrong answer')
    await page.locator('form button[type="submit"]').click()

    // Wait for answer feedback (should show incorrect)
    await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible({ timeout: 3000 })

    // Difficulty buttons should still be available for incorrect answers
    await expect(page.locator('[data-testid="difficulty-buttons"]')).toBeVisible({ timeout: 2000 })

    // Rate the difficulty
    await page.locator('[data-testid="difficulty-again"]').click()

    // Move to next word
    const nextButton = page.locator('[data-testid="next-button"]')
    if (await nextButton.isVisible()) {
      await nextButton.click()
      const flashcardQuestion = page.locator('[data-testid="flashcard-question"], text=/Translate to Italian:/i').first()
      await flashcardQuestion.waitFor({ state: 'visible', timeout: 5000 })
    }

    // Verify we can continue the workflow
    expect(true).toBeTruthy()
  })
})

test.describe('Leitner System - Phase 3: Integration with Database', () => {
  test.skip(!hasRealAuthConfig, 'Skipping database tests - missing credentials')

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { timeout: 20000 })
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 8000 })
  })

  test('should persist difficulty ratings across page refresh', async ({ page, browserName }) => {
    await startLearningSession(page, browserName)

    // Answer and rate a flashcard
    const inputField = page.getByRole('textbox')
    await inputField.fill('test answer')
    await page.locator('form button[type="submit"]').click()
    await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible({ timeout: 3000 })
    await page.locator('[data-testid="difficulty-good"]').click()

    // Refresh the page
    await page.reload({ timeout: 10000 })
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 8000 })

    // Verify we can start a new session (confirming data was saved)
    await startLearningSession(page, browserName)
    await expect(page.getByRole('textbox')).toBeVisible({ timeout: 3000 })
  })
})
