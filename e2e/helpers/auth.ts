import { expect, type Page } from '@playwright/test'

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test-e2e@example.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

const PROTECTED_SELECTOR = '[data-testid="protected-content"]'
const AUTH_SELECTOR = '[data-testid="auth-form-subtitle"]'

const getBaseUrl = (page: Page): string | undefined => {
  if (process.env.PLAYWRIGHT_TEST_BASE_URL) {
    return process.env.PLAYWRIGHT_TEST_BASE_URL
  }

  const currentUrl = page.url()
  if (!currentUrl || currentUrl === 'about:blank') {
    return undefined
  }

  try {
    return new URL(currentUrl).origin
  } catch {
    return undefined
  }
}

async function applyVercelBypass(page: Page): Promise<void> {
  const baseUrl = getBaseUrl(page)
  const bypassToken = process.env.VERCEL_BYPASS_TOKEN

  if (!baseUrl || !bypassToken || !baseUrl.includes('vercel.app')) {
    return
  }

  const target = `${baseUrl}?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${bypassToken}`
  await page.goto(target, { waitUntil: 'networkidle', timeout: 20000 })
  await page.waitForTimeout(500)
}

async function waitForProtectedContent(page: Page, timeout = 15000): Promise<boolean> {
  const protectedLocator = page.locator(PROTECTED_SELECTOR)
  try {
    await protectedLocator.waitFor({ timeout, state: 'visible' })
    return true
  } catch {
    return false
  }
}

async function loginThroughUi(page: Page): Promise<void> {
  await expect(page.locator(AUTH_SELECTOR)).toBeVisible({ timeout: 20000 })
  await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL)
  await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD)
  await page.click('[data-testid="submit-button"]')
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 })
}

export async function ensureAuthenticated(page: Page): Promise<void> {
  await applyVercelBypass(page)
  await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 })

  if (await waitForProtectedContent(page)) {
    return
  }

  console.log('🔐 ensureAuthenticated: signing in through UI')
  await applyVercelBypass(page)
  await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 })
  await loginThroughUi(page)

  if (!(await waitForProtectedContent(page, 20000))) {
    throw new Error('Failed to authenticate test user - protected content not visible')
  }
}
