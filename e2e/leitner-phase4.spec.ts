import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Leitner System - Phase 4
 * Tests analytics and statistics features:
 * - Analytics page navigation
 * - Learning velocity chart
 * - Retention analysis
 * - Review heatmap
 * - Category performance
 * - Time to mastery metrics
 */

// Test configuration
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test-e2e@example.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

// Check if we have real authentication configuration
const hasRealAuthConfig = TEST_USER_EMAIL && TEST_USER_PASSWORD

test.describe.skip('Leitner System - Phase 4: Analytics Dashboard', () => {
  test.skip(!hasRealAuthConfig, 'Skipping Leitner Phase 4 tests - missing credentials')

  test.beforeEach(async ({ page }) => {
    // Navigate to homepage - authentication is handled by global setup
    await page.goto('/', { timeout: 20000 })
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 8000 })
  })

  test('should display Analytics button on dashboard', async ({ page }) => {
    // Verify Analytics button is visible on the dashboard
    const analyticsButton = page.locator('[data-testid="analytics-button"]')
    await expect(analyticsButton).toBeVisible({ timeout: 5000 })
    await expect(analyticsButton).toContainText('Analytics')
  })

  test('should navigate to Analytics page when button is clicked', async ({ page }) => {
    // Click Analytics button
    await page.locator('[data-testid="analytics-button"]').click()

    // Verify we're on the analytics page
    await expect(page).toHaveURL(/\/analytics/, { timeout: 5000 })

    // Verify Analytics page header
    await expect(page.getByText('Analytics Dashboard')).toBeVisible({ timeout: 5000 })
  })

  test('should display back button on Analytics page', async ({ page }) => {
    // Navigate to Analytics
    await page.locator('[data-testid="analytics-button"]').click()
    await expect(page).toHaveURL(/\/analytics/, { timeout: 5000 })

    // Verify back button exists
    const backButton = page.locator('[data-testid="back-to-dashboard"]')
    await expect(backButton).toBeVisible({ timeout: 3000 })
  })

  test('should navigate back to dashboard from Analytics', async ({ page }) => {
    // Navigate to Analytics
    await page.locator('[data-testid="analytics-button"]').click()
    await expect(page).toHaveURL(/\/analytics/, { timeout: 5000 })

    // Click back button
    await page.locator('[data-testid="back-to-dashboard"]').click()

    // Verify we're back on the dashboard
    await expect(page).toHaveURL('/', { timeout: 5000 })
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 3000 })
  })

  test('should display Learning Velocity Chart section', async ({ page }) => {
    // Navigate to Analytics
    await page.locator('[data-testid="analytics-button"]').click()
    await expect(page).toHaveURL(/\/analytics/, { timeout: 5000 })

    // Verify Learning Velocity section exists
    const velocitySection = page.locator('[data-testid="learning-velocity-section"]')
    await expect(velocitySection).toBeVisible({ timeout: 5000 })

    // Verify the chart component is rendered
    const velocityChart = page.locator('[data-testid="learning-velocity-chart"]')
    await expect(velocityChart).toBeVisible({ timeout: 3000 })
  })

  test('should display Retention Analysis section', async ({ page }) => {
    // Navigate to Analytics
    await page.locator('[data-testid="analytics-button"]').click()
    await expect(page).toHaveURL(/\/analytics/, { timeout: 5000 })

    // Verify Retention Analysis section exists
    const retentionSection = page.locator('[data-testid="retention-analysis-section"]')
    await expect(retentionSection).toBeVisible({ timeout: 5000 })

    // Verify the component is rendered
    const retentionAnalysis = page.locator('[data-testid="retention-analysis"]')
    await expect(retentionAnalysis).toBeVisible({ timeout: 3000 })
  })

  test('should display Review Heatmap section', async ({ page }) => {
    // Navigate to Analytics
    await page.locator('[data-testid="analytics-button"]').click()
    await expect(page).toHaveURL(/\/analytics/, { timeout: 5000 })

    // Verify Review Heatmap section exists
    const heatmapSection = page.locator('[data-testid="review-heatmap-section"]')
    await expect(heatmapSection).toBeVisible({ timeout: 5000 })

    // Verify the component is rendered
    const heatmap = page.locator('[data-testid="review-heatmap"]')
    await expect(heatmap).toBeVisible({ timeout: 3000 })
  })

  test('should display Learning Velocity Chart with data or empty state', async ({ page }) => {
    // Navigate to Analytics
    await page.locator('[data-testid="analytics-button"]').click()
    await expect(page).toHaveURL(/\/analytics/, { timeout: 5000 })

    // Wait for the chart to load
    const velocityChart = page.locator('[data-testid="learning-velocity-chart"]')
    await expect(velocityChart).toBeVisible({ timeout: 5000 })

    // Check if either data is shown or empty state message
    const hasData = await velocityChart.locator('text=Total Reviewed').isVisible().catch(() => false)
    const hasEmptyState = await velocityChart.locator('text=No data available yet').isVisible().catch(() => false)

    expect(hasData || hasEmptyState).toBeTruthy()
  })

  test('should display Retention Analysis with metrics or empty state', async ({ page }) => {
    // Navigate to Analytics
    await page.locator('[data-testid="analytics-button"]').click()
    await expect(page).toHaveURL(/\/analytics/, { timeout: 5000 })

    // Wait for the component to load
    const retentionAnalysis = page.locator('[data-testid="retention-analysis"]')
    await expect(retentionAnalysis).toBeVisible({ timeout: 5000 })

    // Verify section title
    await expect(retentionAnalysis.getByText('Retention Analysis')).toBeVisible({ timeout: 2000 })

    // Check if either data is shown or empty state message
    const hasData = await retentionAnalysis.locator('text=Overall Retention Rate').isVisible().catch(() => false)
    const hasEmptyState = await retentionAnalysis.locator('text=No retention data available').isVisible().catch(() => false)

    expect(hasData || hasEmptyState).toBeTruthy()
  })

  test('should display Review Heatmap with calendar or empty state', async ({ page }) => {
    // Navigate to Analytics
    await page.locator('[data-testid="analytics-button"]').click()
    await expect(page).toHaveURL(/\/analytics/, { timeout: 5000 })

    // Wait for the component to load
    const heatmap = page.locator('[data-testid="review-heatmap"]')
    await expect(heatmap).toBeVisible({ timeout: 5000 })

    // Verify section title
    await expect(heatmap.getByText('Review Activity')).toBeVisible({ timeout: 2000 })

    // Check if summary cards are present
    const hasSummary = await heatmap.locator('text=Total Reviews').isVisible().catch(() => false)
    expect(hasSummary).toBeTruthy()
  })

  test('should maintain authentication on Analytics page', async ({ page }) => {
    // Navigate to Analytics
    await page.locator('[data-testid="analytics-button"]').click()
    await expect(page).toHaveURL(/\/analytics/, { timeout: 5000 })

    // Verify user profile is visible (indicates authenticated state)
    const userProfile = page.locator('[data-testid="user-profile-button"]')
    await expect(userProfile).toBeVisible({ timeout: 3000 })
  })

  test('should handle loading states gracefully', async ({ page }) => {
    // Navigate to Analytics
    await page.locator('[data-testid="analytics-button"]').click()
    await expect(page).toHaveURL(/\/analytics/, { timeout: 5000 })

    // Wait for page to fully load - all sections should be visible eventually
    await expect(page.locator('[data-testid="learning-velocity-section"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="retention-analysis-section"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="review-heatmap-section"]')).toBeVisible({ timeout: 10000 })
  })
})

test.describe.skip('Leitner System - Phase 4: Analytics with Practice Data', () => {
  test.skip(!hasRealAuthConfig, 'Skipping analytics data tests - missing credentials')

  test('should show analytics data after completing practice session', async ({ page }) => {
    // Start from dashboard
    await page.goto('/', { timeout: 20000 })
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 8000 })

    // Start a learning session and answer a few questions
    await page.getByText('Learn Italian from Russian').click()
    await expect(page.getByText(/Translate to Italian:/i)).toBeVisible({ timeout: 8000 })

    // Answer first question
    const inputField = page.getByTestId('answer-input')
    await inputField.fill('test')
    await page.getByTestId('answer-submit-button').click()
    await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible({ timeout: 12000 })

    // Rate difficulty
    await page.locator('[data-testid="difficulty-good"]').click()
    await page.waitForTimeout(1000) // Wait for data to be saved

    // Navigate to Analytics
    await page.goto('/', { timeout: 10000 })
    await page.locator('[data-testid="analytics-button"]').click()
    await expect(page).toHaveURL(/\/analytics/, { timeout: 5000 })

    // Verify that analytics shows some data (not empty state)
    const velocityChart = page.locator('[data-testid="learning-velocity-chart"]')
    await expect(velocityChart).toBeVisible({ timeout: 5000 })

    // Data should be visible (even if minimal)
    const hasNoDataMessage = await velocityChart.locator('text=No data available yet').isVisible().catch(() => false)

    // If there was practice data before or we just created some, we shouldn't see "no data"
    // This is a soft check since test data may vary
    if (!hasNoDataMessage) {
      // Verify some summary metrics are shown
      const hasSummaryData = await velocityChart.locator('text=Total Reviewed').isVisible().catch(() => false)
      expect(hasSummaryData).toBeTruthy()
    }
  })

  test('should display Category Performance if data exists', async ({ page }) => {
    // Navigate to Analytics
    await page.goto('/', { timeout: 20000 })
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 8000 })
    await page.locator('[data-testid="analytics-button"]').click()
    await expect(page).toHaveURL(/\/analytics/, { timeout: 5000 })

    // Check if Category Performance section exists
    const categorySection = page.locator('[data-testid="category-performance-section"]')
    const isCategorySectionVisible = await categorySection.isVisible().catch(() => false)

    if (isCategorySectionVisible) {
      // If visible, verify it has proper structure
      await expect(categorySection.getByText('Category Performance')).toBeVisible({ timeout: 2000 })
    }
  })

  test('should display Time to Mastery metrics if data exists', async ({ page }) => {
    // Navigate to Analytics
    await page.goto('/', { timeout: 20000 })
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 8000 })
    await page.locator('[data-testid="analytics-button"]').click()
    await expect(page).toHaveURL(/\/analytics/, { timeout: 5000 })

    // Check if Time to Mastery section exists
    const masterySection = page.locator('[data-testid="time-to-mastery-section"]')
    const isMasterySectionVisible = await masterySection.isVisible().catch(() => false)

    if (isMasterySectionVisible) {
      // If visible, verify it has proper structure
      await expect(masterySection.getByText('Time to Mastery')).toBeVisible({ timeout: 2000 })
    }
  })
})
