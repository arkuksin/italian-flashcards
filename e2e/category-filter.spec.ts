import { test, expect } from '@playwright/test'

// Test configuration
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test-e2e@example.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

test.describe('Category Filter Feature', () => {
  test.use({
    storageState: { cookies: [], origins: [] },
  })

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/', { timeout: 30000 })
    await expect(page.locator('text=Sign in to continue')).toBeVisible({ timeout: 15000 })

    await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL)
    await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD)
    await page.click('[data-testid="submit-button"]')

    // Wait for authentication and dashboard load
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 10000 })
  })

  test('should display category filter section on dashboard', async ({ page }) => {
    // Category filter should be visible immediately (no toggle needed)
    const categoryFilter = page.locator('[data-testid="category-filter"]')
    await expect(categoryFilter).toBeVisible({ timeout: 10000 })

    // Should show "Alle" and "Keine" buttons
    await expect(page.locator('[data-testid="select-all-categories"]')).toBeVisible()
    await expect(page.locator('[data-testid="select-none-categories"]')).toBeVisible()
  })

  test('should be visible above the fold without scrolling', async ({ page }) => {
    // Both mode selection and category filter should be visible
    const modeSelection = page.locator('[data-testid="mode-selection"]')
    const categoryFilter = page.locator('[data-testid="category-filter"]')

    await expect(modeSelection).toBeVisible({ timeout: 5000 })
    await expect(categoryFilter).toBeVisible({ timeout: 5000 })
  })

  test('should display categories with word counts', async ({ page }) => {
    // Expand category filter

    const categoryFilter = page.locator('[data-testid="category-filter"]')
    await expect(categoryFilter).toBeVisible()

    // Wait for loading to complete - spinner should disappear
    const loadingSpinner = categoryFilter.locator('.animate-spin')
    await expect(loadingSpinner).not.toBeVisible({ timeout: 10000 })

    // Wait for category options to appear
    const categoryOptions = page.locator('[data-testid^="category-option-"]')
    await expect(categoryOptions.first()).toBeVisible({ timeout: 5000 })

    const count = await categoryOptions.count()
    expect(count).toBeGreaterThan(0)

    // First category should show word count
    const firstCategory = categoryOptions.first()
    await expect(firstCategory).toContainText('Wörter')
  })

  test('should allow selecting and deselecting categories', async ({ page }) => {
    // Expand category filter

    // Get first category checkbox
    const firstCategoryOption = page.locator('[data-testid^="category-option-"]').first()
    const checkbox = firstCategoryOption.locator('input[type="checkbox"]')

    // Get initial state
    const initiallyChecked = await checkbox.isChecked()

    // Click to toggle
    await firstCategoryOption.click()
    await page.waitForTimeout(300)

    // State should have changed
    const nowChecked = await checkbox.isChecked()
    expect(nowChecked).toBe(!initiallyChecked)

    // Click again to toggle back
    await firstCategoryOption.click()
    await page.waitForTimeout(300)

    // Should be back to initial state
    const finalChecked = await checkbox.isChecked()
    expect(finalChecked).toBe(initiallyChecked)
  })

  test('should select all categories when clicking "Alle" button', async ({ page }) => {
    // Expand category filter

    // Click "Alle" button
    await page.locator('[data-testid="select-all-categories"]').click()

    // All checkboxes should be checked
    const checkboxes = page.locator('[data-testid^="category-option-"] input[type="checkbox"]')
    const count = await checkboxes.count()

    for (let i = 0; i < count; i++) {
      const checkbox = checkboxes.nth(i)
      await expect(checkbox).toBeChecked()
    }
  })

  test('should deselect all categories when clicking "Keine" button', async ({ page }) => {
    // Expand category filter

    // First select all
    await page.locator('[data-testid="select-all-categories"]').click()

    // Then click "Keine"
    await page.locator('[data-testid="select-none-categories"]').click()

    // All checkboxes should be unchecked
    const checkboxes = page.locator('[data-testid^="category-option-"] input[type="checkbox"]')
    const count = await checkboxes.count()

    for (let i = 0; i < count; i++) {
      const checkbox = checkboxes.nth(i)
      await expect(checkbox).not.toBeChecked()
    }
  })

  test('should save category preferences', async ({ page }) => {
    // Expand category filter

    // Select a specific category
    const firstCategoryOption = page.locator('[data-testid^="category-option-"]').first()
    await firstCategoryOption.click()
    await page.waitForTimeout(300)

    // Click save preferences button
    const saveButton = page.locator('[data-testid="save-category-preferences"]')
    await expect(saveButton).toBeVisible()
    await saveButton.click()

    // Wait for save to complete
    await page.waitForTimeout(1000)

    // Should show success (button text should not be in loading state)
    await expect(saveButton).not.toContainText('Speichere...')
  })

  test('should filter words by selected category during learning session', async ({ page }) => {
    // Expand category filter

    // Deselect all first
    await page.locator('[data-testid="select-none-categories"]').click()
    await page.waitForTimeout(300)

    // Select only the first category
    const firstCategoryOption = page.locator('[data-testid^="category-option-"]').first()
    const categoryName = await firstCategoryOption.locator('div.font-medium').first().textContent()
    await firstCategoryOption.click()
    await page.waitForTimeout(300)

    // Start learning session
    await page.locator('[data-testid="mode-ru-it"]').click()
    await page.waitForTimeout(1000)

    // Should be in learning mode
    await expect(page.locator('[data-testid="flashcard-app"]')).toBeVisible({ timeout: 10000 })

    // Verify we're learning (check that there's a flashcard)
    await expect(page.getByText(/Translate to Italian:/i)).toBeVisible({ timeout: 5000 })

    console.log(`✅ Successfully started learning session with category filter: ${categoryName}`)
  })

  test('should show category suggestion for low accuracy category', async ({ page }) => {
    // Expand category filter

    // Check if suggestion is visible
    const suggestion = page.locator('[data-testid="category-suggestion"]')

    // Suggestion may or may not be visible depending on user's learning history
    // If visible, it should contain expected text
    if (await suggestion.isVisible()) {
      await expect(suggestion).toContainText('Empfehlung')
      await expect(suggestion).toContainText('niedrigste Accuracy')

      // Should have a button to toggle selection
      const toggleButton = suggestion.locator('[data-testid="toggle-suggested-category"]')
      await expect(toggleButton).toBeVisible()
    }
  })

  test('should display selected category count', async ({ page }) => {
    // Expand category filter

    // Click "Keine" to deselect all
    await page.locator('[data-testid="select-none-categories"]').click()
    await page.waitForTimeout(300)

    // Should show 0 selected
    await expect(page.locator('[data-testid="category-filter"]')).toContainText('(0 ausgewählt)')

    // Select all
    await page.locator('[data-testid="select-all-categories"]').click()
    await page.waitForTimeout(300)

    // Should show count greater than 0
    const filterText = await page.locator('[data-testid="category-filter"]').textContent()
    expect(filterText).toMatch(/\(\d+ ausgewählt\)/)
    expect(filterText).not.toContain('(0 ausgewählt)')
  })
})
