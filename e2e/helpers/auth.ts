import { expect, type Page } from '@playwright/test'

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test-e2e@example.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

async function loginThroughUi(page: Page): Promise<void> {
  await expect(page.getByTestId('auth-form-subtitle')).toBeVisible({ timeout: 15000 })
  await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL)
  await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD)
  await page.click('[data-testid="submit-button"]')
  await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 15000 })
}

export async function ensureAuthenticated(page: Page): Promise<void> {
  await page.goto('/', { timeout: 30000 })
  const protectedContent = page.locator('[data-testid="protected-content"]')

  if ((await protectedContent.count()) > 0) {
    try {
      await expect(protectedContent).toBeVisible({ timeout: 8000 })
      return
    } catch {
      // Fall through to login attempt
    }
  }

  console.log('🔐 ensureAuthenticated: falling back to manual login')
  await loginThroughUi(page)
}
