import { expect, type Page } from '@playwright/test'

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test-e2e@example.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!'
const PROTECTED_SELECTOR = '[data-testid="protected-content"]'

function getBaseUrl(page: Page): string | undefined {
  return (page.context() as any)?._options?.baseURL || process.env.PLAYWRIGHT_TEST_BASE_URL
}

async function applyVercelBypassIfNeeded(page: Page): Promise<void> {
  const baseURL = getBaseUrl(page)
  const bypassToken = process.env.VERCEL_BYPASS_TOKEN

  if (!baseURL || !bypassToken || !baseURL.includes('vercel.app')) {
    return
  }

  const bypassUrl = `${baseURL}?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${bypassToken}`
  await page.goto(bypassUrl, { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForTimeout(1000)
}

async function loginThroughUi(page: Page): Promise<void> {
  await expect(page.getByTestId('auth-form-subtitle')).toBeVisible({ timeout: 15000 })
  await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL)
  await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD)
  await page.click('[data-testid="submit-button"]')
}

async function waitForProtectedContent(page: Page, timeout = 10000): Promise<boolean> {
  try {
    await page.locator(PROTECTED_SELECTOR).waitFor({ timeout })
    return true
  } catch {
    return false
  }
}

export async function ensureAuthenticated(page: Page): Promise<void> {
  await page.goto('/', { timeout: 30000 })
  if (await waitForProtectedContent(page, 8000)) {
    return
  }

  console.log('🔐 ensureAuthenticated: falling back to manual login')
  await applyVercelBypassIfNeeded(page)
  await page.goto('/login', { timeout: 30000 })
  await loginThroughUi(page)
  await expect(page.locator(PROTECTED_SELECTOR)).toBeVisible({ timeout: 15000 })
}
