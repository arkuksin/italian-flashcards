# Task: Add Production Smoke Tests

**Priority:** 🟠 High (Short-term)
**Effort:** 45 minutes
**Type:** Feature

## Problem

Currently, **production deployments have zero post-deploy verification**. The workflow is:

1. ✅ PR E2E tests pass (on preview deployment)
2. ✅ Merge to main
3. ✅ Vercel deploys to production
4. ❌ **No checks if production deployment works**

If production deployment succeeds but the app is broken (env var mismatch, API issues, etc.), you won't know until a user reports it.

## Solution

Add a production smoke test workflow that runs after successful deployments:

```yaml
# .github/workflows/production-smoke-test.yml
name: Production Smoke Tests

on:
  deployment_status:

jobs:
  smoke-test:
    name: Verify Production Deployment
    if: github.event.deployment_status.state == 'success' && github.event.deployment_status.environment == 'production'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run smoke tests
        env:
          PRODUCTION_URL: ${{ github.event.deployment_status.target_url }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
        run: |
          # Basic health check
          curl -f -s -L "$PRODUCTION_URL" > /dev/null || exit 1
          echo "✅ Site is accessible"

          # Run critical path tests only
          npx playwright test --grep @smoke --project=chromium

      - name: Notify on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🚨 Production Smoke Tests Failed',
              body: `Production deployment succeeded but smoke tests failed.\n\n**Deployment:** ${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
              labels: ['production', 'critical', 'automated']
            });
```

## Acceptance Criteria

- [ ] New workflow `.github/workflows/production-smoke-test.yml` created
- [ ] Triggers on `deployment_status` for production only
- [ ] Runs basic health check (HTTP 200)
- [ ] Runs critical E2E tests tagged with `@smoke`
- [ ] Creates GitHub issue if tests fail
- [ ] Completes in < 5 minutes

## Implementation Details

### 1. Tag Critical Tests with @smoke

```typescript
// e2e/auth.spec.ts
test.describe('Authentication @smoke', () => {
  test('user can login', async ({ page }) => {
    // Critical path test
  });
});

// e2e/flashcards.spec.ts
test.describe('Flashcards @smoke', () => {
  test('user can review a card', async ({ page }) => {
    // Critical path test
  });
});
```

### 2. Update Playwright Config

```typescript
// playwright.config.ts
export default defineConfig({
  // Existing config...

  projects: [
    {
      name: 'smoke-chromium',
      use: { ...devices['Desktop Chrome'] },
      grep: /@smoke/,
    },
  ],
});
```

### 3. Keep Tests Fast

Smoke tests should cover:
- ✅ Homepage loads
- ✅ Login works
- ✅ Core feature (flashcard review) works
- ❌ Don't test every edge case

Target: < 3 minutes for all smoke tests

## Benefits

- **Catch production issues immediately** - Before users see them
- **Confidence in deployments** - Know if rollout succeeded
- **Automated incident detection** - Creates issue automatically
- **Fast feedback** - 5-minute verification vs. hours of user reports

## Monitoring vs. Testing

This is **active testing**, not passive monitoring. For continuous monitoring, consider:
- Vercel Analytics (already available)
- Error tracking (Sentry, LogRocket)
- Uptime monitoring (UptimeRobot, Pingdom)

Smoke tests complement these by validating critical paths immediately after deploy.

## Related

- See: `tasks/cicd-improvements/04-add-basic-ci-checks.md` (pre-deployment validation)
- See: `tasks/cicd-improvements/09-add-monitoring.md` (continuous monitoring)
