You are bringing the Playwright “Progress Tracking” suite back to green.

Context:
- `e2e/progress-tracking.spec.ts` and related specs rely on several `data-testid` hooks: `question-text`, `answer-feedback`, `next-button`, `progress-bar`, `session-active`, `restart-button`, etc.
- The recent UI rewrite replaced those elements with new components (`src/components/FlashCard.tsx`, `src/components/ProgressBar.tsx`, `src/pages/Dashboard.tsx`) but did not reapply the test ids. The tests now fail with `locator.fill`/`locator.textContent` timeouts because they cannot find the selectors.
- We only need stable hooks; the visuals and styling can stay as-is.

Task:
1. Re-introduce the missing `data-testid` attributes on the new components so they match the selectors used in the tests. Prefer attaching the id to the smallest reliable element (e.g., the input wrapper for `progress-bar`, the mastery indicator container, the submit and navigation buttons).
2. When a selector maps to a component that renders multiple instances, ensure the test id is placed on the intended element to avoid ambiguity—use `data-testid` on the specific button rather than its parent container.
3. After updating the markup, run `npx playwright test e2e/progress-tracking.spec.ts --project=chromium` to confirm all timeouts disappear, and commit the changes together with any necessary snapshot updates.
