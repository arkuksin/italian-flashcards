# Task: Add Basic CI Checks (Lint + Build + Test)

**Priority:** 🔴 High (Immediate)
**Effort:** 20 minutes
**Type:** Feature

## Problem

The project has **no pre-deployment validation** in CI. Currently:
- ❌ Linting errors aren't caught until manual review
- ❌ Build failures only surface in Vercel (not GitHub)
- ❌ Unit tests exist (`npm run test`) but never run in CI

E2E tests run only AFTER deployment, which is too late for basic issues.

## Solution

Add a fast, cheap CI workflow that runs on every PR and push to main:

```yaml
# .github/workflows/ci.yml
name: CI Checks

on:
  pull_request:
  push:
    branches: [main]

jobs:
  lint-build-test:
    name: Lint, Build, and Test
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

      - name: Run linter
        run: npm run lint

      - name: Build application
        run: npm run build

      - name: Run unit tests
        run: npm run test
        if: success()

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        if: success()
        with:
          name: build-output
          path: dist/
          retention-days: 7
```

## Acceptance Criteria

- [ ] New workflow `.github/workflows/ci.yml` created
- [ ] Workflow runs on PRs and main branch pushes
- [ ] All three steps execute: lint, build, test
- [ ] Build artifacts uploaded for debugging
- [ ] Workflow completes in < 3 minutes
- [ ] Branch protection updated to require this check

## Benefits

- **Catches issues 10x faster** - Before deployment, not after
- **Reduces costs** - Fails in 2 min vs. waiting 15 min for E2E
- **Better developer experience** - Immediate feedback on PRs
- **Prevents broken builds** - Can't merge if build fails

## Implementation Notes

### Caching Strategy
Use npm cache (already configured) for dependencies. Consider adding build cache:

```yaml
- name: Cache build output
  uses: actions/cache@v4
  with:
    path: |
      dist
      .vite
    key: build-${{ hashFiles('src/**', 'vite.config.ts') }}
```

### Branch Protection
After workflow is working, update branch protection rules:

```bash
npm run setup:branch-protection
# Add "CI Checks / lint-build-test" as required status check
```

## Related

- See: `tasks/cicd-improvements/11-add-production-smoke-tests.md` (adds post-deploy checks)
- Complements: `pr-e2e-tests.yml` (which tests deployed preview)
