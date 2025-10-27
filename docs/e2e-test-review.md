# Italian Flashcards – E2E Test Suite Review

## Overall Assessment

| Area | Score (1–5) | Notes |
| --- | --- | --- |
| Coverage | 2 | Core happy-path login and session flows exist, but large portions of auth edge cases, error handling, and configuration coverage live in `.skip` files and never execute. |
| Reliability | 1 | Heavy reliance on timeouts, persistent data, and production infrastructure make the suite brittle and highly flaky. |
| Maintainability | 2 | Duplicated login logic, unused utilities, and console-driven validation increase upkeep cost. |
| Overall | **2 / 5** | Tests provide limited safety net; they require significant hardening before they can gate releases. |

**Strengths**
- Exercises the full authenticated user flow end-to-end, including logout/login and stats visibility (`e2e/full-user-flow.spec.ts`).
- Validates dashboard vs. flashcard stat parity (`e2e/stats-consistency.spec.ts`), which protects key KPIs from regression.

**Critical Gaps**
- “Skip” guards do not work as intended, so tests that expect real credentials still run with placeholder data and fail (`e2e/progress-tracking.spec.ts:3-12`).
- Many scenarios log observations without assertions, meaning regressions will not be caught (`e2e/full-user-flow.spec.ts:224-250`).
- No data reset or test user isolation; progress accumulation across runs leads to non-deterministic behavior and polluted analytics.
- Disabled suites cover essential auth/error states (`e2e/auth-protection.spec.ts.skip`) leaving major risks untested.

## Detailed Findings

### Coverage Risks
- Authentication error handling, social login visibility, and auth-mode toggling exist only in `.skip` files (`e2e/auth-protection.spec.ts.skip`). These never run, so regressions in the public login surface will slip through.
- Progress tracking scenarios only assert that UI text is “truthy” instead of validating actual numeric changes (`e2e/full-user-flow.spec.ts:140-154`, `e2e/progress-tracking.spec.ts:146-152`). This gives false confidence that statistics are correct.
- Offline mode test performs no verification beyond console logging (`e2e/full-user-flow.spec.ts:224-250`), so offline regressions remain undetected.
- No coverage for spaced repetition correctness, mastery thresholds, or streak logic beyond checking UI renders (`e2e/progress-tracking.spec.ts:186-209`), leaving algorithmic defects unguarded.

### Reliability & Flakiness
- Suites depend on real Supabase data and mutate shared state without cleanup. Re-running tests in parallel browsers multiplies race conditions and inconsistent stats.
- Frequent `page.waitForTimeout(...)` calls (e.g., `e2e/full-user-flow.spec.ts:175-215`, `e2e/progress-tracking.spec.ts:161-175`) introduce timing flakiness and slow execution.
- Global storage state is generated from a real login (`e2e/global-setup.ts`). If credentials expire or the login flow changes, the entire suite fails before tests start. Tests that require a fresh session manually clear state, duplicating logic.
- `quick-auth-check.spec.ts` reaches into private Playwright APIs (`page.context()._options.baseURL`), which can break on Playwright upgrades.

### Maintainability Observations
- `e2e/test-utils.ts` offers reusable helpers, yet most specs hand-roll navigation and login flows, increasing drift and update effort.
- Copied credential defaults appear in multiple files. Centralizing in a helper or environment loader would prevent mismatches.
- Extensive console logging adds noise to CI output but rarely feeds assertions, masking real failures.
- Multiple `.skip` files increase confusion about the authoritative suite and risk accidental bit-rot.

### Environment & Data Management
- No fixture resets or Supabase cleanup scripts exist. Progress, streaks, and mastery metrics will continuously grow, invalidating comparisons and causing mismatches across browsers.
- Tests assume `test-e2e@example.com` user exists with a known password. Without automated provisioning, onboarding a new environment is manual and error-prone.
- JUnit/JSON reporters are configured, but without stable assertions the artifacts provide little actionable insight.

## Recommendations

1. **Fix credential gating**: Remove hard-coded fallbacks and make `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` mandatory, skipping suites when absent. Add a health check that fails fast if authentication cannot be established.
2. **Replace timeouts with events**: Use Playwright assertions tied to UI changes (e.g., `locator.waitFor`, `expect.poll`) and eliminate `waitForTimeout` calls.
3. **Strengthen assertions**: Compare numeric deltas for stats, verify offline banners/toasts, and assert mastery level transitions with deterministic seeds.
4. **Adopt reusable helpers**: Refactor login and navigation into `test-utils.ts`, ensuring every spec consumes shared flows and reducing copy-paste drift.
5. **Re-enable or migrate skipped suites**: Either move vital auth/error tests into active specs (perhaps with mocked network responses) or delete/replace them with maintainable coverage.
6. **Data isolation**: Seed a dedicated Supabase schema or reset user progress before each run (API helper or SQL script) so statistics comparisons stay deterministic.
7. **CI readiness**: Gate on Chromium-only initially with retries enabled, then expand to other browsers once stability improves. Track flake rate via reporter outputs.

## Suggested Next Steps
- Prioritize fixing the failing skip guard and adding deterministic data setup; without these, the suite remains unusable for CI gating.
- Convert high-signal `.skip` scenarios (auth protection, Vercel preview checks) into runnable specs via network mocking or test doubles.
- After stabilization, add targeted coverage for error states (network failures, invalid answers, expired sessions) to increase confidence in core learning flows.
