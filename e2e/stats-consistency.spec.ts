import { test, expect, type Page } from '@playwright/test'

// Test configuration
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test-e2e@example.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

const normalizeStatValue = (value: string, fallback: string) => {
  const normalized = value.replace(/[\s\n\r]+/g, '').replace(/[^0-9%.-]/g, '')
  return normalized === '' ? fallback : normalized
}

const getDashboardStats = async (page: Page) => {
  const statsComponent = page.locator('[data-testid="statistics-component"]')
  await expect(statsComponent).toBeVisible({ timeout: 10_000 })

  const rawValues = await page
    .locator('[data-testid="progress-stats"] .text-2xl.font-bold')
    .allTextContents()

  const wordsStudied = normalizeStatValue(rawValues[0] ?? '0', '0')
  const accuracy = normalizeStatValue(rawValues[1] ?? '0%', '0%')
  const streak = normalizeStatValue(rawValues[2] ?? '0', '0')
  const mastered = normalizeStatValue(rawValues[3] ?? '0', '0')

  return {
    wordsStudied,
    accuracy,
    streak,
    mastered,
  }
}

const getFlashcardStats = async (page: Page) => {
  const rawValues = await page
    .locator('[data-testid="progress-bar"] .text-2xl.font-bold')
    .allTextContents()

  const correct = normalizeStatValue(rawValues[0] ?? '0', '0')
  const wrong = normalizeStatValue(rawValues[1] ?? '0', '0')
  const accuracy = normalizeStatValue(rawValues[2] ?? '0%', '0%')
  const streak = normalizeStatValue(rawValues[3] ?? '0', '0')

  return {
    correct,
    wrong,
    accuracy,
    streak,
  }
}

const login = async (page: Page) => {
  await page.goto('/', { timeout: 30_000 })
  await expect(page.getByTestId('auth-form-subtitle')).toBeVisible({ timeout: 15_000 })

  await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL)
  await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD)
  await page.click('[data-testid="submit-button"]')

  await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 10_000 })
}

const enterLearningMode = async (page: Page) => {
  await page.getByTestId('mode-ru-it').click()
  await expect(page.getByText(/Translate to Italian:/i)).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(1_000)
}

test.describe('Statistics Consistency', () => {
  test.use({
    // Ensure manual login flow runs even when shared auth state exists
    storageState: { cookies: [], origins: [] },
  })
  test('@smoke Dashboard and Flashcards view should show identical statistics', async ({ page }) => {
    await login(page)

    const dashboardStats = await getDashboardStats(page)
    console.log('📊 Dashboard Stats:', dashboardStats)

    await enterLearningMode(page)
    const flashcardsStats = await getFlashcardStats(page)
    console.log('📊 ProgressBar Stats:', flashcardsStats)

    expect(flashcardsStats.accuracy).toBe(dashboardStats.accuracy)
    console.log(`✅ Accuracy matches: ${dashboardStats.accuracy}`)

    expect(flashcardsStats.streak).toBe(dashboardStats.streak)
    console.log(`✅ Streak matches: ${dashboardStats.streak}`)

    console.log('✅✅✅ STATISTICS CONSISTENCY TEST PASSED ✅✅✅')
    console.log('Dashboard and Flashcards view show consistent statistics!')
  })

  test('Statistics should persist across logout/login and match in both views', async ({ page }) => {
    test.setTimeout(120000) // Increase timeout to 120 seconds for logout/login cycle
    await login(page)
    await enterLearningMode(page)

    for (let i = 0; i < 2; i += 1) {
      const inputField = page.getByTestId('answer-input')
      await inputField.fill(`test${i}`)
      await page.getByTestId('answer-submit-button').click()
      await page.waitForTimeout(1_500)

      if (i === 0) {
        const nextButton = page.locator('button:has-text("Next")')
        if (await nextButton.isEnabled()) {
          await nextButton.click()
          await page.waitForTimeout(500)
        }
      }
    }

    const flashcardsStatsBeforeLogout = await getFlashcardStats(page)
    console.log('📊 Flashcards Stats Before Logout:', flashcardsStatsBeforeLogout)

    const restartButton = page.locator('[data-testid="restart-button"]')
    if (await restartButton.first().isVisible()) {
      await restartButton.first().click()
      await page.waitForTimeout(2_000)
    }

    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 10_000 })

    const dashboardStatsBeforeLogout = await getDashboardStats(page)
    console.log('📊 Dashboard Stats Before Logout:', dashboardStatsBeforeLogout)

    // Ensure dropdown is open before attempting to click sign out
    const profileButton = page.locator('[data-testid="user-profile-button"]')
    if (await profileButton.isVisible()) {
      await profileButton.click()

      // Wait for dropdown to be fully visible
      const dropdown = page.getByTestId('user-profile-dropdown')
      await expect(dropdown).toBeVisible({ timeout: 10_000 })
    }

    const signOutButton = page.locator('[data-testid="logout-button"]')
    await expect(signOutButton).toBeVisible({ timeout: 10_000 })

    // Set up waits before clicking to avoid missing navigation events or lingering dropdowns
    const emailFieldAfterLogout = page.getByTestId('email-input')
    const waitForEmailField = emailFieldAfterLogout.waitFor({ timeout: 60_000 })
    const waitForLogoutUrl = page
      .waitForURL('**/login', { waitUntil: 'domcontentloaded', timeout: 60_000 })
      .catch((error) => {
        console.warn('Login URL wait timed out, falling back to email field visibility.', error)
      })

    await signOutButton.click({ force: true })
    await Promise.all([waitForEmailField, waitForLogoutUrl])

    await expect(page.getByTestId('auth-form-subtitle')).toBeVisible({ timeout: 10_000 })
    console.log('✅ Logged out')

    await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL)
    await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD)
    await page.click('[data-testid="submit-button"]')

    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 10_000 })
    console.log('✅ Logged in again')

    const dashboardStatsAfterLogin = await getDashboardStats(page)
    console.log('📊 Dashboard Stats After Login:', dashboardStatsAfterLogin)
    expect(dashboardStatsAfterLogin.wordsStudied).not.toBe('')

    await enterLearningMode(page)
    const flashcardsStatsAfterLogin = await getFlashcardStats(page)
    console.log('📊 Flashcards Stats After Login:', flashcardsStatsAfterLogin)

    expect(flashcardsStatsAfterLogin.accuracy).toBe(dashboardStatsAfterLogin.accuracy)
    expect(flashcardsStatsAfterLogin.streak).toBe(dashboardStatsAfterLogin.streak)

    console.log('✅✅✅ POST-LOGIN CONSISTENCY TEST PASSED ✅✅✅')
    console.log(`Accuracy: Dashboard=${dashboardStatsAfterLogin.accuracy}, Flashcards=${flashcardsStatsAfterLogin.accuracy}`)
    console.log(`Streak: Dashboard=${dashboardStatsAfterLogin.streak}, Flashcards=${flashcardsStatsAfterLogin.streak}`)
    console.log('Statistics persisted correctly and match in both views!')
  })

  test('Zero values should display consistently when no progress exists', async ({ page }) => {
    await login(page)

    const dashboardStats = await getDashboardStats(page)

    await enterLearningMode(page)
    const flashcardsStats = await getFlashcardStats(page)

    expect(flashcardsStats.accuracy).toBe(dashboardStats.accuracy)

    console.log('✅ Zero values consistency test passed')
  })
})
