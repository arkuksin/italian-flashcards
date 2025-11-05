You are updating the Playwright suite for `italian-flashcards`.

Context:
- `e2e/full-user-flow.spec.ts` still clicks a legacy “Sign Out” button that no longer exists.
- The dashboard now exposes sign-out only through the `UserProfile` dropdown (`src/components/Header.tsx`, `src/components/auth/UserProfile.tsx`).
- When the test fails to log out it keeps the dashboard rendered, so the subsequent expectation `locator('text=Sign in to continue')` times out during CI.

Task:
1. Adjust the full user flow test so it opens the profile dropdown first (via `data-testid="user-profile-button"`), then clicks the new logout control (`data-testid="logout-button"`).
2. Keep the existing retry/backoff structure minimal—prefer `Promise.all` with proper expectations instead of `waitForTimeout`.
3. Verify locally with `npx playwright test e2e/full-user-flow.spec.ts --project=chromium` and make sure the logout assertion passes before committing.
