import { expect, type Page } from '@playwright/test'

const MODE_CARD_SELECTOR = '[data-testid^="mode-"]'
const DEFAULT_PREFERRED_DIRECTIONS = ['ru-it', 'it-ru']

export async function ensureModeSelectionVisible(page: Page): Promise<void> {
  const firstCard = page.locator(MODE_CARD_SELECTOR).first()
  await expect(firstCard).toBeVisible({ timeout: 10000 })
}

export async function selectLearningMode(page: Page, preferredDirections: string[] = []): Promise<string> {
  await ensureModeSelectionVisible(page)

  const directionsToTry = preferredDirections.length > 0 ? preferredDirections : DEFAULT_PREFERRED_DIRECTIONS

  for (const direction of directionsToTry) {
    const candidate = page.getByTestId(`mode-${direction}`)
    try {
      await candidate.scrollIntoViewIfNeeded()
      if (await candidate.isVisible({ timeout: 2000 })) {
        await candidate.click()
        await expect(page.getByTestId('flashcard-app')).toBeVisible({ timeout: 15000 })
        return direction
      }
    } catch {
      // Button not present or not clickable; try next
    }
  }

  const fallback = page.locator(MODE_CARD_SELECTOR).first()
  await fallback.click()
  const testId = await fallback.getAttribute('data-testid')
  return testId?.replace('mode-', '') ?? ''
}
