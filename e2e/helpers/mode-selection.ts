import { expect, type Page } from '@playwright/test'

const MODE_CARD_SELECTOR = '[data-testid^="mode-"]'

export async function ensureModeSelectionVisible(page: Page): Promise<void> {
  const firstCard = page.locator(MODE_CARD_SELECTOR).first()
  await expect(firstCard).toBeVisible({ timeout: 10000 })
}

export async function selectLearningMode(page: Page, preferredDirections: string[] = []): Promise<string> {
  await ensureModeSelectionVisible(page)

  for (const direction of preferredDirections) {
    const candidate = page.getByTestId(`mode-${direction}`)
    try {
      if (await candidate.isVisible()) {
        await candidate.click()
        return direction
      }
    } catch {
      // Button not present; try next
    }
  }

  const fallback = page.locator(MODE_CARD_SELECTOR).first()
  await fallback.click()
  const testId = await fallback.getAttribute('data-testid')
  return testId?.replace('mode-', '') ?? ''
}
