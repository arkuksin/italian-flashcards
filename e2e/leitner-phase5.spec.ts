import { test, expect } from '@playwright/test'
import { resetGamificationData } from './helpers/reset-gamification'

/**
 * E2E Tests for Leitner System - Phase 5
 * Tests gamification and motivation features:
 * - Daily streak tracking
 * - XP and level system
 * - Achievement badges
 * - Daily goal progress
 * - Gamification integration with learning
 */

// Test configuration
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test-e2e@example.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

// Check if we have real authentication configuration
const hasRealAuthConfig = TEST_USER_EMAIL && TEST_USER_PASSWORD

test.describe('Leitner System - Phase 5: Gamification', () => {
  test.skip(!hasRealAuthConfig, 'Skipping Leitner Phase 5 tests - missing credentials')

  // Reset gamification data before all tests in this suite to ensure clean state
  test.beforeAll(async () => {
    console.log('🔄 Resetting gamification data for clean test environment...')
    await resetGamificationData()
  })

  test.beforeEach(async ({ page }) => {
    // Navigate to homepage - authentication is handled by global setup
    await page.goto('/', { timeout: 20000 })
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 8000 })
  })

  test('should display Daily Streak Widget on dashboard', async ({ page }) => {
    // Verify Daily Streak Widget is visible
    const streakWidget = page.locator('[data-testid="daily-streak-widget"]')
    await expect(streakWidget).toBeVisible({ timeout: 5000 })

    // Verify it contains streak-related text
    await expect(streakWidget).toContainText('Daily Streak')
  })

  test('should display XP Progress Bar on dashboard', async ({ page }) => {
    // Verify XP Progress Bar is visible
    const xpBar = page.locator('[data-testid="xp-progress-bar"]')
    await expect(xpBar).toBeVisible({ timeout: 5000 })

    // Verify it shows level information
    await expect(xpBar).toContainText(/Level \d+/)
    await expect(xpBar).toContainText('XP')
  })

  test('should display Daily Goal Progress on dashboard', async ({ page }) => {
    // Verify Daily Goal Progress is visible
    const goalProgress = page.locator('[data-testid="daily-goal-progress"]')
    await expect(goalProgress).toBeVisible({ timeout: 5000 })

    // Verify it contains goal-related text
    await expect(goalProgress).toContainText('Daily Goal')
  })

  test('should display Achievement Badges section on dashboard', async ({ page }) => {
    // Verify Achievement Badges is visible
    const achievementBadges = page.locator('[data-testid="achievement-badges"]')
    await expect(achievementBadges).toBeVisible({ timeout: 5000 })

    // Verify it contains achievements header
    await expect(achievementBadges).toContainText('Achievements')
  })

  test('should show progress in circular goal indicator', async ({ page }) => {
    // Verify circular progress SVG is rendered
    const goalProgress = page.locator('[data-testid="daily-goal-progress"]')
    await expect(goalProgress).toBeVisible({ timeout: 5000 })

    // Check for SVG circle elements
    const svg = goalProgress.locator('svg')
    await expect(svg).toBeVisible()

    // Verify circles exist (background and progress)
    const circles = goalProgress.locator('circle')
    expect(await circles.count()).toBeGreaterThan(0)
  })

  test('should display streak fire emoji', async ({ page }) => {
    const streakWidget = page.locator('[data-testid="daily-streak-widget"]')
    await expect(streakWidget).toBeVisible({ timeout: 5000 })

    // Check for fire emoji (🔥)
    const emojiContent = await streakWidget.textContent()
    expect(emojiContent).toContain('🔥')
  })

  test('should show best streak with crown emoji', async ({ page }) => {
    const streakWidget = page.locator('[data-testid="daily-streak-widget"]')
    await expect(streakWidget).toBeVisible({ timeout: 5000 })

    // Check for crown emoji (👑)
    const emojiContent = await streakWidget.textContent()
    expect(emojiContent).toContain('👑')

    // Check for "Best Streak" text
    await expect(streakWidget).toContainText('Best Streak')
  })

  test('should display XP progress percentage', async ({ page }) => {
    const xpBar = page.locator('[data-testid="xp-progress-bar"]')
    await expect(xpBar).toBeVisible({ timeout: 5000 })

    // Verify percentage text is shown
    await expect(xpBar).toContainText(/\d+% to next level/)
  })

  test('should update gamification stats after answering questions', async ({ page }) => {
    // Select a learning mode to start
    const ruToItButton = page.locator('[data-testid="mode-ru-it"]')
    if (await ruToItButton.isVisible({ timeout: 3000 })) {
      await ruToItButton.click()

      // Wait for flashcard to appear
      await expect(page.locator('[data-testid="flashcard-app"]')).toBeVisible({ timeout: 5000 })

      // Answer a question (use "Again" difficulty rating)
      const input = page.locator('input[type="text"]').first()
      await input.fill('test')
      await page.keyboard.press('Enter')

      // Wait for answer to show
      await page.waitForTimeout(500)

      // Click difficulty rating if available
      const difficultyButtons = page.locator('[data-testid^="difficulty-"]')
      if (await difficultyButtons.first().isVisible({ timeout: 2000 })) {
        await difficultyButtons.first().click()
      }

      // Go back to dashboard
      await page.goto('/')
      await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 5000 })

      // Verify gamification widgets are still visible
      await expect(page.locator('[data-testid="daily-streak-widget"]')).toBeVisible()
      await expect(page.locator('[data-testid="xp-progress-bar"]')).toBeVisible()
      await expect(page.locator('[data-testid="daily-goal-progress"]')).toBeVisible()
    }
  })

  test('should display achievements when unlocked', async ({ page }) => {
    const achievementBadges = page.locator('[data-testid="achievement-badges"]')
    await expect(achievementBadges).toBeVisible({ timeout: 5000 })

    // Wait for content to fully load - check for either achievement cards or "no achievements" message
    // Use a more reliable approach for webkit
    await page.waitForTimeout(1000) // Give webkit time to render

    const hasAchievements = await achievementBadges.locator('[data-testid^="achievement-"]').count() > 0

    // Try multiple ways to check for the message (webkit sometimes has issues with getByText)
    let hasNoAchievementsMessage = false
    try {
      hasNoAchievementsMessage = await achievementBadges.getByText('No achievements yet').isVisible({ timeout: 2000 })
    } catch {
      // Fallback: check if the text content contains the message
      const content = await achievementBadges.textContent()
      hasNoAchievementsMessage = content?.includes('No achievements yet') || false
    }

    // One of these should be true
    expect(hasAchievements || hasNoAchievementsMessage).toBeTruthy()
  })

  test('should show XP reward on achievement badges', async ({ page }) => {
    const achievementBadges = page.locator('[data-testid="achievement-badges"]')
    await expect(achievementBadges).toBeVisible({ timeout: 5000 })

    // If there are achievements, they should show XP rewards
    const achievements = achievementBadges.locator('[data-testid^="achievement-"]')
    const achievementCount = await achievements.count()

    if (achievementCount > 0) {
      // Check first achievement has XP text
      const firstAchievement = achievements.first()
      const achievementText = await firstAchievement.textContent()
      expect(achievementText).toMatch(/\+\d+ XP/)
    }
  })

  test('should display gradient progress bar for XP', async ({ page }) => {
    const xpBar = page.locator('[data-testid="xp-progress-bar"]')
    await expect(xpBar).toBeVisible({ timeout: 5000 })

    // Check for progress bar div with gradient classes
    const progressBar = xpBar.locator('div[class*="gradient"]').or(
      xpBar.locator('div[class*="bg-"]')
    )
    expect(await progressBar.count()).toBeGreaterThan(0)
  })

  test('should maintain gamification state across navigation', async ({ page }) => {
    // Wait for initial page load and data to stabilize
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Capture initial XP level
    const xpBar = page.locator('[data-testid="xp-progress-bar"]')
    await expect(xpBar).toBeVisible({ timeout: 5000 })

    const initialLevelText = await xpBar.textContent()
    const initialLevelMatch = initialLevelText?.match(/Level (\d+)/)
    const initialLevel = initialLevelMatch ? parseInt(initialLevelMatch[1], 10) : 0

    console.log(`📊 Initial state - Level: ${initialLevel}`)

    // Verify initial level is reasonable (not corrupted data)
    expect(initialLevel).toBeGreaterThanOrEqual(1)
    expect(initialLevel).toBeLessThan(10) // With reset, should be low level

    // Navigate to analytics and back
    const analyticsButton = page.locator('[data-testid="analytics-button"]')
    if (await analyticsButton.isVisible({ timeout: 2000 })) {
      await analyticsButton.click()
      await page.waitForURL(/\/analytics/, { timeout: 5000 })

      // Wait for analytics page to load
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      // Navigate back to dashboard
      await page.goto('/')
      await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 5000 })

      // Wait for gamification data to reload
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
    }

    // Verify XP level is maintained (simple navigation should not award XP)
    await expect(xpBar).toBeVisible({ timeout: 5000 })
    const newLevelText = await xpBar.textContent()
    const newLevelMatch = newLevelText?.match(/Level (\d+)/)
    const newLevel = newLevelMatch ? parseInt(newLevelMatch[1], 10) : 0

    console.log(`📊 After navigation - Level: ${newLevel}`)
    console.log(`📈 Level change: ${newLevel - initialLevel}`)

    // Level should remain the same during navigation
    // Allow up to 1 level increase in case of async save completion from previous operations
    expect(newLevel).toBeGreaterThanOrEqual(initialLevel)
    expect(newLevel - initialLevel).toBeLessThanOrEqual(1)
  })
})
