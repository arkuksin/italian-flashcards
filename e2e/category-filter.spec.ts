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

  test.skip('should display category filter section on mode selection screen', async ({ page }) => {
    // Category filter section should be visible
    const categoryFilterToggle = page.locator('[data-testid="toggle-category-filter"]')
    await expect(categoryFilterToggle).toBeVisible({ timeout: 10000 })

    // Should contain the correct text
    await expect(categoryFilterToggle).toContainText('Kategorien filtern')
    await expect(categoryFilterToggle).toContainText('optional')
  })

  test.skip('should expand and collapse category filter', async ({ page }) => {
    const categoryFilterToggle = page.locator('[data-testid="toggle-category-filter"]')
    await expect(categoryFilterToggle).toBeVisible()

    // Initially should be collapsed (filter should not be visible)
    const categoryFilter = page.locator('[data-testid="category-filter"]')
    await expect(categoryFilter).not.toBeVisible()

    // Click to expand
    await categoryFilterToggle.click()
    await page.waitForTimeout(500) // Wait for animation

    // Now filter should be visible
    await expect(categoryFilter).toBeVisible({ timeout: 5000 })

    // Should show "Alle" and "Keine" buttons
    await expect(page.locator('[data-testid="select-all-categories"]')).toBeVisible()
    await expect(page.locator('[data-testid="select-none-categories"]')).toBeVisible()

    // Click to collapse
    await categoryFilterToggle.click()
    await page.waitForTimeout(500)

    // Filter should be hidden again
    await expect(categoryFilter).not.toBeVisible()
  })

  test('should display categories with word counts', async ({ page }) => {
    // DEBUG: Enable console logging
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()))
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message))

    // Expand category filter
    console.log('🔍 DEBUG: Clicking toggle button')
    await page.locator('[data-testid="toggle-category-filter"]').click()
    await page.waitForTimeout(500)

    const categoryFilter = page.locator('[data-testid="category-filter"]')
    console.log('🔍 DEBUG: Checking if category filter is visible')
    await expect(categoryFilter).toBeVisible()

    // DEBUG: Get the actual HTML content
    const htmlContent = await categoryFilter.innerHTML()
    console.log('🔍 DEBUG: CategoryFilter innerHTML:', htmlContent.substring(0, 500))

    // Should show at least one category option
    const categoryOptions = page.locator('[data-testid^="category-option-"]')
    const count = await categoryOptions.count()
    console.log('🔍 DEBUG: Category options count:', count)

    // DEBUG: Take screenshot
    await page.screenshot({ path: 'test-results/debug-category-filter.png', fullPage: true })
    console.log('🔍 DEBUG: Screenshot saved')

    expect(count).toBeGreaterThan(0)

    // First category should show word count
    const firstCategory = categoryOptions.first()
    await expect(firstCategory).toContainText('Wörter')
  })

  test.skip('should allow selecting and deselecting categories', async ({ page }) => {
    // Expand category filter
    await page.locator('[data-testid="toggle-category-filter"]').click()
    await page.waitForTimeout(500)

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

  test.skip('should select all categories when clicking "Alle" button', async ({ page }) => {
    // Expand category filter
    await page.locator('[data-testid="toggle-category-filter"]').click()
    await page.waitForTimeout(500)

    // Click "Alle" button
    await page.locator('[data-testid="select-all-categories"]').click()
    await page.waitForTimeout(500)

    // All checkboxes should be checked
    const checkboxes = page.locator('[data-testid^="category-option-"] input[type="checkbox"]')
    const count = await checkboxes.count()

    for (let i = 0; i < count; i++) {
      const checkbox = checkboxes.nth(i)
      await expect(checkbox).toBeChecked()
    }
  })

  test.skip('should deselect all categories when clicking "Keine" button', async ({ page }) => {
    // Expand category filter
    await page.locator('[data-testid="toggle-category-filter"]').click()
    await page.waitForTimeout(500)

    // First select all
    await page.locator('[data-testid="select-all-categories"]').click()
    await page.waitForTimeout(500)

    // Then click "Keine"
    await page.locator('[data-testid="select-none-categories"]').click()
    await page.waitForTimeout(500)

    // All checkboxes should be unchecked
    const checkboxes = page.locator('[data-testid^="category-option-"] input[type="checkbox"]')
    const count = await checkboxes.count()

    for (let i = 0; i < count; i++) {
      const checkbox = checkboxes.nth(i)
      await expect(checkbox).not.toBeChecked()
    }
  })

  test.skip('should save category preferences', async ({ page }) => {
    // Expand category filter
    await page.locator('[data-testid="toggle-category-filter"]').click()
    await page.waitForTimeout(500)

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

  test.skip('should filter words by selected category during learning session', async ({ page }) => {
    // Expand category filter
    await page.locator('[data-testid="toggle-category-filter"]').click()
    await page.waitForTimeout(500)

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

  test.skip('should show category suggestion for low accuracy category', async ({ page }) => {
    // Expand category filter
    await page.locator('[data-testid="toggle-category-filter"]').click()
    await page.waitForTimeout(500)

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

  test.skip('should display selected category count', async ({ page }) => {
    // Expand category filter
    await page.locator('[data-testid="toggle-category-filter"]').click()
    await page.waitForTimeout(500)

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
