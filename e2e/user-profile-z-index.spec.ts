import { test, expect } from '@playwright/test'

/**
 * Simple Z-Index Test for UserProfile Dropdown
 *
 * This test verifies that the UserProfile dropdown has correct z-index values
 * to appear above flashcard elements.
 *
 * Test approach:
 * 1. Login if needed
 * 2. Open dropdown
 * 3. Check z-index values
 * 4. Verify dropdown is clickable (not hidden)
 */

test.describe('UserProfile Dropdown Z-Index', () => {
  test('dropdown z-index should be higher than flashcard', async ({ page }) => {
    // Navigate to app
    await page.goto('/')

    // Handle authentication
    const emailInput = page.locator('[data-testid="email-input"]')
    const isLoginPage = await emailInput.isVisible().catch(() => false)

    if (isLoginPage) {
      // Login
      const testEmail = process.env.TEST_USER_EMAIL || 'test-e2e@example.com'
      const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

      await emailInput.fill(testEmail)
      await page.locator('[data-testid="password-input"]').fill(testPassword)
      await page.locator('[data-testid="submit-button"]').click()

      // Wait for dashboard
      await page.waitForURL('/', { timeout: 10000 })
    }

    // Wait for mode selection and select it
    await page.waitForSelector('[data-testid="mode-ru-it"]', { timeout: 10000 })
    await page.click('[data-testid="mode-ru-it"]')

    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="user-profile-button"]', { timeout: 10000 })

    // Click user profile button (retry once to handle flaky preview toolbar clicks)
    const profileButton = page.locator('[data-testid="user-profile-button"]')
    const dropdown = page.locator('[data-testid="user-profile-dropdown"]')

    await profileButton.click()

    if (!(await dropdown.isVisible())) {
      await page.waitForTimeout(500)
      await profileButton.click()
    }

    // Wait for dropdown to appear
    await expect(dropdown).toBeVisible({ timeout: 15000 })

    // Wait for layout/animations to settle before reading styles
    await dropdown.waitFor({ state: 'visible' })
    await page.waitForTimeout(300)

    const readDropdownZIndex = async () => {
      return dropdown.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return computed.zIndex
      })
    }

    // Get z-index of dropdown (retry once if CI closes the menu instantly)
    let dropdownZIndex: string
    try {
      dropdownZIndex = await readDropdownZIndex()
    } catch (error) {
      console.warn('Dropdown vanished before measuring, retrying once...', error)
      await profileButton.click({ force: true })
      await expect(dropdown).toBeVisible({ timeout: 5000 })
      await dropdown.waitFor({ state: 'visible' })
      dropdownZIndex = await readDropdownZIndex()
    }

    console.log(`Dropdown z-index: ${dropdownZIndex}`)

    // Check if z-index is set correctly
    const zIndexNum = parseInt(dropdownZIndex)

    // Log the result
    if (zIndexNum < 50) {
      console.log(`❌ BUG CONFIRMED: Dropdown z-index is ${zIndexNum}, should be >= 50`)
    } else {
      console.log(`✅ Dropdown z-index is ${zIndexNum}, correctly set`)
    }

    // Assert z-index is high enough
    expect(zIndexNum).toBeGreaterThanOrEqual(50)

    // Verify we can interact with the dropdown (it's not hidden)
    const logoutButton = dropdown.locator('[data-testid="logout-button"]')
    await expect(logoutButton).toBeVisible()
    await expect(logoutButton).toBeEnabled()

    console.log('✅ Dropdown is fully interactive and visible')
  })
})
