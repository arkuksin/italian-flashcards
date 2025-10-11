import { test, expect } from '@playwright/test'

/**
 * Diagnostic test to understand what's happening after login
 * This test will fail fast and show us the actual state of the page
 */

test.describe('Diagnostic Tests', () => {
  test('should show what page we land on after login', async ({ page }) => {
    console.log('=== Starting Diagnostic Test ===')
    console.log('Base URL:', page.url())

    // Navigate to the app
    await page.goto('/')
    console.log('After goto /:', page.url())

    // Take screenshot of initial page
    await page.screenshot({ path: 'test-results/01-initial-page.png', fullPage: true })

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded')
    console.log('After domcontentloaded:', page.url())

    // Check what's visible on the page
    const pageTitle = await page.title()
    console.log('Page title:', pageTitle)

    // Check if we're on login page
    const isLoginPage = await page.locator('[data-testid="email-input"]').isVisible().catch(() => false)
    console.log('Is on login page?', isLoginPage)

    if (isLoginPage) {
      console.log('=== Attempting login ===')
      const testEmail = process.env.TEST_USER_EMAIL || 'test-e2e@example.com'
      const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

      console.log('Using email:', testEmail)

      await page.fill('[data-testid="email-input"]', testEmail)
      await page.fill('[data-testid="password-input"]', testPassword)

      // Take screenshot before submit
      await page.screenshot({ path: 'test-results/02-before-submit.png', fullPage: true })

      await page.click('[data-testid="submit-button"]')
      console.log('Clicked submit button')

      // Wait a moment
      await page.waitForTimeout(2000)
      console.log('After 2s wait, URL:', page.url())

      // Take screenshot after submit
      await page.screenshot({ path: 'test-results/03-after-submit.png', fullPage: true })

      // Check if there are any error messages
      const errorVisible = await page.locator('[role="alert"]').isVisible().catch(() => false)
      if (errorVisible) {
        const errorText = await page.locator('[role="alert"]').textContent()
        console.log('ERROR MESSAGE:', errorText)
      }

      // Wait for navigation with a short timeout
      try {
        await page.waitForURL('/', { timeout: 3000 })
        console.log('Successfully navigated to /')
      } catch (e) {
        console.log('Did not navigate to / within 3s, current URL:', page.url())
      }

      // Take screenshot of final page
      await page.screenshot({ path: 'test-results/04-final-page.png', fullPage: true })
      console.log('Final URL:', page.url())
    }

    // List all visible elements with data-testid
    const allTestIds = await page.locator('[data-testid]').evaluateAll((elements) =>
      elements.map(el => ({
        testId: el.getAttribute('data-testid'),
        visible: el.offsetParent !== null,
        text: el.textContent?.substring(0, 50)
      }))
    )
    console.log('All data-testid elements:', JSON.stringify(allTestIds, null, 2))

    // Check for specific elements we're looking for
    const hasFlashcardApp = await page.locator('[data-testid="flashcard-app"]').count()
    const hasUserProfileButton = await page.locator('[data-testid="user-profile-button"]').count()

    console.log('Has flashcard-app?', hasFlashcardApp > 0)
    console.log('Has user-profile-button?', hasUserProfileButton > 0)

    // This test intentionally fails to show us the output
    expect(hasFlashcardApp).toBeGreaterThan(0)
  })
})
