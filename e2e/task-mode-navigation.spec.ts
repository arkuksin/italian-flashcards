import { test, expect } from '@playwright/test';
import { startLearningSession, waitForFlashcard, expectModeSelection } from './test-utils';

test.skip(process.env.CI, 'Playwright browsers are not available in CI yet.');

test.describe('Task mode navigation safeguards', () => {
  test('prompts to confirm before opening analytics with unsaved input', async ({ page }) => {
    await startLearningSession(page);
    await waitForFlashcard(page);

    await page.getByTestId('answer-input').fill('ciao');
    await page.getByRole('button', { name: 'Analyse öffnen' }).click();

    const dialog = page.getByTestId('confirm-leave-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Fortschritt sichern?');

    await dialog.getByRole('button', { name: 'Fortschritt speichern & wechseln' }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/analytics/);
  });

  test('allows discarding progress and returning to mode selection', async ({ page }) => {
    await startLearningSession(page);
    await waitForFlashcard(page);

    await page.getByTestId('answer-input').fill('grazie');
    await page.getByRole('button', { name: 'Zur Auswahl' }).click();

    const dialog = page.getByTestId('confirm-leave-dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Ohne Speichern verlassen' }).click();
    await expect(dialog).toBeHidden();

    await expectModeSelection(page);
  });
});
