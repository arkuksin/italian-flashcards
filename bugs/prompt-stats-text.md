You are fixing the statistics consistency Playwright spec.

Context:
- `e2e/stats-consistency.spec.ts` compares strings such as `"0%Accuracy"` between the dashboard and flashcard sidebar.
- The new `Statistics` component (`src/components/Statistics.tsx`) splits value and label into separate nodes (`<div className="text-2xl font-bold">0%</div>` + `<div className="text-xs">Accuracy</div>`), so the concatenated string no longer exists. Logs show `Expected: "0%Accuracy", Received: "0%"`.
- We only care that the numeric values match in both places; the layout should remain semantic.

Task:
1. Update the failing tests to read the numeric values explicitly (e.g., grab `[data-testid="progress-stats"] div` value spans, or parse `textContent` and strip whitespace before comparison).
2. Ensure the assertions tolerate minor formatting differences (line breaks, emojis) but still fail if the numbers diverge.
3. Re-run `npx playwright test e2e/stats-consistency.spec.ts --project=chromium` to validate, and tidy up any helper utilities you create during the change.
