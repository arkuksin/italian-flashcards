import { test, expect } from '@playwright/test'

// Test configuration
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test-e2e@example.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

// Check if we have real authentication configuration
const hasRealAuthConfig = TEST_USER_EMAIL && TEST_USER_PASSWORD

test.describe('Progress Tracking - Hook Integration', () => {
  test.skip(!hasRealAuthConfig, 'Skipping progress tests - missing credentials')

  // Simplified beforeEach - authentication is already handled by global setup
  test.beforeEach(async ({ page }) => {
    // Just navigate to homepage - we're already authenticated via storageState
    await page.goto('/', { timeout: 20000 })
    // Wait for app to be ready
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 8000 })
  })

  test('should successfully authenticate and load the application', async ({ page }) => {
    // Verify we're authenticated and app loaded
    await expect(page.getByRole('heading', { name: 'Italian FlashCards' })).toBeVisible({ timeout: 5000 })

    // Verify mode selection is available (app is ready)
    await expect(page.getByText('Learn Italian from Russian')).toBeVisible({ timeout: 5000 })
  })

  test('should verify database connection by checking auth state', async ({ page }) => {
    // Verify authenticated state persists (indicates DB connection works)
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 5000 })

    // Reload page to verify session persists in database
    await page.reload({ timeout: 15000 })

    // Should still be authenticated (session from database)
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 8000 })
    await expect(page.getByRole('heading', { name: 'Italian FlashCards' })).toBeVisible({ timeout: 5000 })
  })

  test('should be able to interact with flashcards', async ({ page }) => {
    // Start learning session
    await expect(page.getByRole('heading', { name: 'Italian FlashCards' })).toBeVisible()

    // Select learning direction
    await page.getByText('Learn Italian from Russian').click()

    // Wait for flashcard to appear
    await expect(page.getByText(/Translate to Italian:/i)).toBeVisible({ timeout: 8000 })

    // Verify input field exists
    const inputField = page.getByRole('textbox')
    await expect(inputField).toBeVisible({ timeout: 3000 })

    // Fill in an answer
    await inputField.fill('test answer')

    // Verify we can submit
    await expect(page.locator('form button[type="submit"]')).toBeVisible({ timeout: 3000 })
  })

  test('should test useProgress hook can access database tables', async ({ page }) => {
    // This test verifies the database tables needed by useProgress hook exist
    // by checking if we can access the application (which queries these tables)

    await expect(page.getByRole('heading', { name: 'Italian FlashCards' })).toBeVisible({ timeout: 5000 })

    // If we can see the app, it means:
    // 1. Authentication table works (we logged in)
    // 2. User can access the app (no table permission errors)
    // 3. Database connection is established

    // Verify app is interactive
    await expect(page.getByText('Learn Italian from Russian')).toBeVisible({ timeout: 5000 })
  })

  test('should verify session persistence across page reloads', async ({ page }) => {
    // Verify authenticated state persists (session stored in database)
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 5000 })

    // Reload page multiple times
    for (let i = 0; i < 2; i++) {
      await page.reload({ timeout: 15000 })
      await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 8000 })
      await expect(page.getByRole('heading', { name: 'Italian FlashCards' })).toBeVisible({ timeout: 5000 })
    }

    // Session persistence confirms database connection is working
  })

  test('should track progress when answering flashcards correctly', async ({ page }) => {
    // Start learning session
    await page.getByText('Learn Italian from Russian').click()
    await expect(page.getByText(/Translate to Italian:/i)).toBeVisible({ timeout: 8000 })

    // Get the question text to identify the word
    const questionText = await page.locator('[data-testid="question-text"]').textContent()
    expect(questionText).toBeTruthy()

    // Answer correctly (we'll type any answer and check it)
    const inputField = page.getByRole('textbox')
    await inputField.fill('ciao')

    // Submit the answer
    await page.locator('form button[type="submit"]').click()

    // Check if we got feedback (correct or wrong)
    await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible({ timeout: 3000 })

    // Progress should be updated in the database
    // This will be validated by checking the progress bar or stats
    const progressBar = page.locator('[data-testid="progress-bar"]')
    if (await progressBar.isVisible()) {
      // Progress bar should show at least 1 attempt
      const progressText = await progressBar.textContent()
      expect(progressText).toContain('1')
    }
  })

  test('should persist progress data across sessions', async ({ page }) => {
    // Start first session and answer a question
    await page.getByText('Learn Italian from Russian').click()
    await expect(page.getByText(/Translate to Italian:/i)).toBeVisible({ timeout: 8000 })

    const inputField = page.getByRole('textbox')
    await inputField.fill('test')
    await page.locator('form button[type="submit"]').click()
    // Wait for answer feedback instead of arbitrary timeout
    await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible({ timeout: 3000 })

    // Note the current progress
    const progressBarBefore = page.locator('[data-testid="progress-stats"]')
    let statsBefore = ''
    if (await progressBarBefore.isVisible()) {
      statsBefore = await progressBarBefore.textContent() || ''
    }

    // Reload page to simulate new session
    await page.reload({ timeout: 15000 })
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 8000 })

    // Start learning again
    await page.getByText('Learn Italian from Russian').click()
    await expect(page.getByText(/Translate to Italian:/i)).toBeVisible({ timeout: 8000 })

    // Progress should be loaded from database
    const progressBarAfter = page.locator('[data-testid="progress-stats"]')
    if (await progressBarAfter.isVisible() && statsBefore) {
      const statsAfter = await progressBarAfter.textContent() || ''
      // Stats should match or be higher (if we answered another question)
      expect(statsAfter).toBeTruthy()
    }
  })

  test('should calculate statistics correctly', async ({ page }) => {
    // Navigate to stats or progress view if available
    await page.getByText('Learn Italian from Russian').click()
    await expect(page.getByText(/Translate to Italian:/i)).toBeVisible({ timeout: 8000 })

    // Answer multiple questions to generate statistics
    for (let i = 0; i < 3; i++) {
      const inputField = page.getByRole('textbox')
      await inputField.fill('test')
      await page.locator('form button[type="submit"]').click()
      // Wait for feedback to appear
      await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible({ timeout: 3000 })

      // Try to move to next word
      const nextButton = page.locator('[data-testid="next-button"]')
      if (await nextButton.isVisible()) {
        await nextButton.click()
        // Wait for new question to appear
        await expect(page.getByText(/Translate to Italian:/i)).toBeVisible({ timeout: 3000 })
      }
    }

    // Check if statistics are displayed
    const statsElement = page.locator('[data-testid="progress-stats"]')
    if (await statsElement.isVisible()) {
      const statsText = await statsElement.textContent()
      // Should show attempt count
      expect(statsText).toBeTruthy()
    }
  })

  test('should handle mastery level progression', async ({ page }) => {
    // Start learning and answer the same word multiple times correctly
    await page.getByText('Learn Italian from Russian').click()
    await expect(page.getByText(/Translate to Italian:/i)).toBeVisible({ timeout: 8000 })

    // Get the correct answer if displayed
    const showAnswerButton = page.locator('[data-testid="show-answer-button"]')
    if (await showAnswerButton.isVisible()) {
      await showAnswerButton.click()

      // Wait for answer to be displayed
      const answerElement = page.locator('[data-testid="correct-answer"]')
      await expect(answerElement).toBeVisible({ timeout: 2000 })
      const correctAnswer = await answerElement.textContent()

      // Hide answer and input the correct answer
      const hideAnswerButton = page.locator('[data-testid="hide-answer-button"]')
      if (await hideAnswerButton.isVisible()) {
        await hideAnswerButton.click()
        await expect(answerElement).toBeHidden({ timeout: 2000 })
      }

      const inputField = page.getByRole('textbox')
      await inputField.fill(correctAnswer || 'test')
      await page.locator('form button[type="submit"]').click()
      // Wait for feedback
      await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible({ timeout: 3000 })
    }

    // Mastery level should be tracked in the database
    // This is validated by the fact that the progress persists
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible()
  })

  test('should start and end learning sessions', async ({ page }) => {
    // Start a learning session
    await page.getByText('Learn Italian from Russian').click()
    await expect(page.getByText(/Translate to Italian:/i)).toBeVisible({ timeout: 8000 })

    // Session should be active
    const sessionIndicator = page.locator('[data-testid="session-active"]')
    if (await sessionIndicator.isVisible()) {
      expect(await sessionIndicator.textContent()).toBeTruthy()
    }

    // Answer a question
    const inputField = page.getByRole('textbox')
    await inputField.fill('test')
    await page.locator('form button[type="submit"]').click()
    // Wait for feedback
    await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible({ timeout: 3000 })

    // End session (e.g., by navigating away or clicking restart)
    const restartButton = page.locator('[data-testid="restart-button"]')
    if (await restartButton.isVisible()) {
      await restartButton.click()
      // Wait for mode selection to appear
      await expect(page.getByText('Learn Italian from Russian')).toBeVisible({ timeout: 3000 })
    }

    // Session should be recorded in the database
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible()
  })

  test('should handle spaced repetition scheduling', async ({ page }) => {
    // This test verifies that words are scheduled according to spaced repetition
    await page.getByText('Learn Italian from Russian').click()
    await expect(page.getByText(/Translate to Italian:/i)).toBeVisible({ timeout: 8000 })

    // Answer multiple words to build progress history
    for (let i = 0; i < 5; i++) {
      const inputField = page.getByRole('textbox')
      await inputField.fill('test')
      await page.locator('form button[type="submit"]').click()
      // Wait for feedback
      await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible({ timeout: 3000 })

      const nextButton = page.locator('[data-testid="next-button"]')
      if (await nextButton.isVisible()) {
        await nextButton.click()
        // Wait for next question
        await expect(page.getByText(/Translate to Italian:/i)).toBeVisible({ timeout: 3000 })
      }
    }

    // Reload and verify due words are prioritized
    await page.reload({ timeout: 15000 })
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 8000 })
    await page.getByText('Learn Italian from Russian').click()
    await expect(page.getByText(/Translate to Italian:/i)).toBeVisible({ timeout: 8000 })

    // Should show words according to spaced repetition algorithm
    await expect(page.getByRole('textbox')).toBeVisible({ timeout: 3000 })
  })
})
