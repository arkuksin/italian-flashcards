# E2E Pipeline Acceleration Plan

## Goal
Reduce wall-clock time of the "E2E Tests with Vercel Preview" workflow without sacrificing test coverage or confidence. Target: cut average run time from ~15 minutes to <8 minutes per PR.

## Current Bottlenecks
1. **Preview deploy cost (~1m20s)** – Vercel deploy + health check runs serially before any tests start.
2. **Redundant environment setup per browser (~3m each)** – every matrix job performs `npm ci` (26s) and `npx playwright install … --with-deps` (>2m) even though the runner image already has most dependencies.
3. **Single Playwright worker** – config enforces `workers: 1` on CI, so 30+ specs execute strictly sequentially.
4. **Heavy `waitForTimeout` usage** – explicit 500‑2000 ms sleeps sprinkled through specs add deterministic delay.
5. **Older Node 18 runtime** – npm emits EBADENGINE warnings; newer packages expect Node 20+, and we miss node 20 performance & caching improvements.

## Proposed Improvements
| # | Action | Description | Expected Impact | QA Considerations |
|---|--------|-------------|-----------------|-------------------|
| 1 | Switch workflow to Node 20 LTS | Update `actions/setup-node` to `node-version: '20'` and align local tooling. Resolves EBADENGINE warnings and unlocks faster npm installs. | -10‑15s per job (npm) + future compatibility | No coverage change; ensure docs mention Node 20 requirement. |
| 2 | Cache npm + Playwright assets | Use `actions/setup-node` built-in cache plus `actions/cache` for `~/.cache/ms-playwright` keyed by Playwright version. Avoid rerunning `npm ci` and `playwright install` on every job when lockfile unchanged. | -30‑40s per browser (npm) and -90s per browser (Playwright) | Cache invalidation handled via lockfile hash; still reinstall when deps bump. |
| 3 | Replace `npx playwright install … --with-deps` | The runner image already has system deps for major browsers. Switch to `npx playwright install ${{ matrix.browser }}` without `--with-deps`, and only install Chromium once per workflow (e.g., small setup job uploads `playwright/.local-browsers` artifact for other jobs). | Saves the apt-get step (~2m/job). | If a missing lib surfaces, fall back to `playwright install-deps` for that browser only. |
| 4 | Allow limited parallelism | Set `workers` to `process.env.CI ? 2 : undefined` and mark the heaviest specs with `test.describe.configure({ mode: 'serial' })` if they must stay sequential. | Cuts per-browser runtime roughly in half, assuming specs independent. | Validate no shared-state collisions; rely on existing shared auth state but keep tests idempotent. |
| 5 | Replace fixed sleeps with event waits | Refactor `page.waitForTimeout` occurrences (Full User Flow, Stats Consistency) to wait on specific locators or network idle. | Removes ~10‑15 seconds of forced delay per browser. | Improves determinism; keep a tiny fallback timeout if needed. |
| 6 | Introduce tiered workflow | Keep current full matrix triggered on `push` to `main` & scheduled nightly. For PRs, run Chromium-only fast gate plus optional "Full Matrix" label-trigger (uses `workflow_dispatch`). | Quick feedback (<5m) for most PRs while still running full coverage before merge/nightly. | Communicate policy; ensure Merge queue checks both statuses or require full run before merge. |
| 7 | Optimize Vercel deploy step | Use `vercel pull --yes --environment=preview` + `vercel deploy --prebuilt` when no serverless functions changed, or reuse an earlier preview if SHA already deployed. | Avoid redundant build time when pipeline reruns for same commit. | Need guardrails to avoid testing stale code; only re-use deploy when commit hash matches. |

## Implementation Order
1. **Node 20 + caching (Actions only)** – **done** (small YAML change, immediate benefit).
2. **Playwright install optimization** – remove `--with-deps`, add cache/artifact sharing.
3. **Parallel workers** – adjust `playwright.config.ts`, audit specs for shared state.
4. **Test refactors** – replace `waitForTimeout` with event-based waits.
5. **Workflow tiering / deploy reuse** – larger process change; tackle after quick wins prove stable.

## Validation
- After each change, capture workflow run times (use `gh run view … --json` to log `runStartedAt`, `runDuration`).
- Keep Chromium job as canary for measuring improvements.
- Ensure full matrix still runs at least once before merging to `main` (manual dispatch or branch protection). EOF
