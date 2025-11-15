# Testing Guide

Comprehensive documentation for testing the Italian Flashcards application, including E2E tests, authentication testing, and best practices for email bounce prevention.

## Table of Contents

- [Quick Start](#quick-start)
- [Testing Philosophy](#testing-philosophy)
- [E2E Testing with Playwright](#e2e-testing-with-playwright)
- [Authentication Testing](#authentication-testing)
- [Email Bounce Prevention (CRITICAL)](#email-bounce-prevention-critical)
- [Test Database Setup](#test-database-setup)
- [Running Tests](#running-tests)
- [CI/CD Pipeline](#cicd-pipeline)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Quick Start

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/real-auth.spec.ts

# Create a test user (safely in test database)
npm run test:create-user

# Reset test user's gamification data (fixes accumulated data issues)
npm run test:reset-gamification

# Clean up test users
npm run test:cleanup-users
```

## Testing Philosophy

### Core Principles

1. **Real Authentication** - Tests use actual Supabase authentication (not mocks)
2. **Separate Test Database** - Never test against production data
3. **Email Safety** - Zero tolerance for fake emails that cause bounces
4. **Comprehensive Coverage** - Test full user journeys, not just units
5. **CI/CD Integration** - Tests run automatically on every PR

### Test Types

| Type | Framework | Coverage | Status |
|------|-----------|----------|--------|
| **E2E Tests** | Playwright | Full user flows | ✅ Active |
| **Integration Tests** | Playwright | Component interactions | ✅ Active |
| **Unit Tests** | Vitest | Utilities, hooks | 🚧 Planned |
| **Visual Tests** | Percy | UI regression | 🚧 Planned |

## E2E Testing with Playwright

### Test Suite Overview

**Location**: `/e2e/`

**Active Tests**:
- `real-auth.spec.ts` - Real Supabase authentication flows
- `full-user-flow.spec.ts` - Complete learning session from login to logout
- `progress-tracking.spec.ts` - Progress persistence and Leitner system
- `stats-consistency.spec.ts` - Statistics calculations and accuracy
- `quick-auth-check.spec.ts` - Fast auth smoke test
- `privacy-policy.spec.ts` - Privacy policy page rendering
- `user-profile-z-index.spec.ts` - UI dropdown z-index fixes

**Utility Files**:
- `test-utils.ts` - Shared test helpers
- `global-setup.ts` - Global test configuration

### Configuration

**File**: `playwright.config.ts`

**Key Settings**:
```typescript
{
  testDir: './e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI
  }
}
```

### Writing E2E Tests

**Example Test Structure**:

```typescript
import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './test-utils';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('should do something specific', async ({ page }) => {
    // Arrange
    await page.goto('/');

    // Act
    await page.click('[data-testid="action-button"]');

    // Assert
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

**Best Practices**:
- Use `data-testid` attributes for reliable selectors
- Test user behavior, not implementation details
- Keep tests independent and idempotent
- Use shared utilities from `test-utils.ts`
- Clean up state after tests

## Authentication Testing

### Architecture

```
GitHub Actions PR Workflow
    ↓
Deploy to Vercel Preview (test database)
    ↓
Run Playwright E2E Tests (test user)
    ↓
Tests authenticate against Test Supabase
    ↓
Cleanup Preview Deployment
```

### Two Separate Databases

**1. Production Database** ⚠️
- **URL**: `https://gjftooyqkmijlvqbkwdr.supabase.co`
- **Purpose**: Real user data
- **Environment**: Production deployments only
- **Users**: Real application users
- **⚠️ NEVER use for testing**

**2. Test Database** ✅
- **URL**: `https://slhyzoupwluxgasvapoc.supabase.co`
- **Purpose**: E2E testing
- **Environment**: Local dev + Vercel Preview
- **Users**: Test users only (`test-e2e@example.com`)
- **✅ Safe for all testing**

### Test User Account

**Credentials** (test database only):
```
Email: test-e2e@example.com
Password: [stored in GitHub Secrets]
Status: Email confirmed (auto-confirmed for testing)
```

**Creating Test Users**:
```bash
# Safe way to create test users
npm run test:create-user

# This script:
# 1. Connects to test database only
# 2. Validates email format
# 3. Creates confirmed user
# 4. Logs creation for audit
```

### Environment Configuration

#### Local Development (`.env.local`)
```bash
# Test database configuration (safe for local dev)
VITE_SUPABASE_URL=https://slhyzoupwluxgasvapoc.supabase.co
VITE_SUPABASE_ANON_KEY=<test_database_anon_key>
NODE_ENV=development
```

#### GitHub Actions Secrets
```bash
# Required secrets (Settings → Secrets and variables → Actions)
TEST_USER_EMAIL=test-e2e@example.com
TEST_USER_PASSWORD=<test_user_password>
VERCEL_TOKEN=<vercel_token>
VERCEL_ORG_ID=<org_id>
VERCEL_PROJECT_ID=<project_id>
```

#### Vercel Environment Variables

**Preview Environment** (for PRs):
```bash
VITE_SUPABASE_URL=https://slhyzoupwluxgasvapoc.supabase.co
VITE_SUPABASE_ANON_KEY=<test_database_anon_key>
NODE_ENV=test
VITE_TEST_MODE=true
```

**Production Environment** (main branch):
```bash
VITE_SUPABASE_URL=https://gjftooyqkmijlvqbkwdr.supabase.co
VITE_SUPABASE_ANON_KEY=<prod_database_anon_key>
NODE_ENV=production
```

## Email Bounce Prevention (CRITICAL)

### Why This Matters

High email bounce rates cause Supabase to **restrict email sending privileges**, breaking:
- ❌ User sign-ups (no confirmation emails)
- ❌ Password resets
- ❌ Account verification
- ❌ Your entire authentication system

**Goal**: Maintain 0% bounce rate through proper testing practices.

### Bounce Rate Thresholds

| Bounce Rate | Status | Impact |
|-------------|--------|--------|
| 0-1% | 🟢 Excellent | No issues |
| 1-3% | 🟡 Warning | Monitor closely |
| 3-5% | 🟠 Concerning | Take action |
| 5%+ | 🔴 Critical | **Email sending restricted** |

### ❌ NEVER Use These Email Domains

**Blocked by email validator** in `src/lib/emailValidator.ts`:

```
@test.com              @mailinator.com       @guerrillamail.com
@example.com           @temp-mail.org        @throwaway.email
@fakeinbox.com         @invalid.com          @yopmail.com
@10minutemail.com      @trashmail.com        @tempmail.com
@dispostable.com       @maildrop.cc
```

**Why**: These addresses bounce immediately, damaging sender reputation.

### ❌ NEVER Use These Email Patterns

```
test@*                 fake@*                invalid@*
demo@*                 throwaway@*           temp@*
dummy@*                asdf@*                qwerty@*
```

### ✅ Safe Email Practices

**For Testing**:
1. Use ONLY the test database (`slhyzoupwluxgasvapoc.supabase.co`)
2. Use the official test user: `test-e2e@example.com`
3. Create test users with `npm run test:create-user` (validates emails)
4. Clean up test users regularly with `npm run test:cleanup-users`

**For Production**:
1. NEVER manually create fake users
2. NEVER use throwaway email domains
3. Use email validator on all sign-up forms (already implemented)
4. Monitor bounce rates with `npm run health:check`

### Email Validator

**Location**: `src/lib/emailValidator.ts`

**Features**:
- Blocks 14 known throwaway domains
- Validates email format (RFC 5322)
- Used in `LoginForm.tsx` on sign-up
- Prevents 99% of bounce-causing emails

**Usage**:
```typescript
import { isValidEmail, getEmailValidationError } from '@/lib/emailValidator';

const email = 'user@test.com';
if (!isValidEmail(email)) {
  const error = getEmailValidationError(email);
  console.error(error); // "Email domain '@test.com' is not allowed"
}
```

## Test Database Setup

### Schema Structure

**Tables**:
- `words` - 300+ Russian-Italian word pairs
- `user_progress` - Individual word progress per user (Leitner system)
- `learning_sessions` - Session tracking and statistics

**See**: [docs/dev/DATABASE.md](./DATABASE.md) for detailed schema

### Creating Test Database

**Option 1: Automatic Setup**
```bash
# Run the setup script (creates schema, seeds data)
npm run test:setup
```

**Option 2: Manual Setup**
1. Create new Supabase project
2. Run schema from `docs/MANUAL_SCHEMA_SETUP.md`
3. Seed words data
4. Configure RLS policies
5. Update `.env.local` with test database credentials

### Database Maintenance

```bash
# List all users in test database
npm run test:list-users

# Reset gamification data for test user (recommended before test runs)
npm run test:reset-gamification

# Clean up test users (dry run - preview only)
npm run test:cleanup-users

# Delete specific users (with confirmation)
npm run test:delete-users

# Audit production database (read-only)
npm run prod:list-users

# Preview production cleanup (NEVER auto-delete from prod!)
npm run prod:cleanup-users
```

## Running Tests

### Local Development

**Basic Test Run**:
```bash
# Run all tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/real-auth.spec.ts

# Run tests matching pattern
npx playwright test -g "authentication"

# Run in specific browser
npx playwright test --project=chromium
```

**Interactive Mode**:
```bash
# UI mode (best for development)
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npx playwright test --debug
```

**Test Options**:
```bash
# Run tests against local dev server
npm run test:e2e

# Run tests against deployed URL
PLAYWRIGHT_TEST_BASE_URL=https://preview.vercel.app npx playwright test

# Run with specific user
TEST_USER_EMAIL=test@example.com TEST_USER_PASSWORD=pass123 npx playwright test
```

### CI/CD Environment

Tests run automatically on every PR via `.github/workflows/pr-e2e-tests.yml`.

**Workflow Steps**:
1. Deploy to Vercel Preview (test database)
2. Health check deployment
3. Run Playwright tests in parallel
4. Process test results
5. Comment on PR with results
6. Cleanup preview deployment

**Test Execution**:
```yaml
- name: Run Playwright tests
  env:
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
    PLAYWRIGHT_TEST_BASE_URL: ${{ steps.deploy.outputs.preview-url }}
  run: npx playwright test --reporter=html,line
```

## CI/CD Pipeline

### Pull Request Workflow

**File**: `.github/workflows/pr-e2e-tests.yml`

**Triggers**:
- Pull request opened
- Pull request updated (new commits)
- Pull request reopened

**Steps**:

1. **Deploy Preview** - Deploy PR to Vercel Preview with test database
2. **Health Check** - Verify deployment is accessible
3. **Run Tests** - Execute Playwright E2E tests against preview
4. **Report Results** - Comment on PR with test results and preview link
5. **Cleanup** - Remove preview deployment

**Concurrency**:
- Only one workflow per PR at a time
- New commits cancel previous runs
- Saves CI minutes and Vercel build time

**Test Parallelization**:
```yaml
strategy:
  matrix:
    browser: [chromium, firefox, webkit]
```

### Production Deployment

**Workflow**: `.github/workflows/production-deploy.yml`

**Triggers**:
- Push to `main` branch
- Manual workflow dispatch

**Environment**: Uses production database (real users)

**Safety**: Tests must pass on PR before merge to main

## Troubleshooting

### Common Issues

#### Tests Fail Locally but Pass in CI

**Cause**: Different environment variables

**Solution**:
```bash
# Check your .env.local
cat .env.local

# Should point to test database
VITE_SUPABASE_URL=https://slhyzoupwluxgasvapoc.supabase.co
```

#### Authentication Tests Fail

**Symptoms**: "Invalid login credentials" or timeout

**Possible Causes**:
1. Test user doesn't exist in test database
2. Using wrong database (production instead of test)
3. Test user password changed
4. Email not confirmed

**Solution**:
```bash
# Verify test user exists
npm run test:list-users | grep test-e2e

# Create test user if missing
npm run test:create-user

# Check environment variables
echo $TEST_USER_EMAIL
echo $PLAYWRIGHT_TEST_BASE_URL
```

#### Tests Time Out

**Symptoms**: Tests hang or exceed 30s timeout

**Possible Causes**:
1. Slow network to Supabase
2. Database not responding
3. Too many parallel tests

**Solution**:
```bash
# Run tests serially (slower but more stable)
npx playwright test --workers=1

# Increase timeout
npx playwright test --timeout=60000

# Run specific test to isolate issue
npx playwright test e2e/quick-auth-check.spec.ts
```

#### Preview Deployment Fails

**Symptoms**: Vercel deployment errors in CI

**Possible Causes**:
1. Missing Vercel secrets
2. Build errors
3. Vercel account limits

**Solution**:
1. Check GitHub Secrets are set correctly
2. Verify Vercel project settings
3. Check Vercel dashboard for error logs
4. Ensure VERCEL_TOKEN has correct permissions

### Debugging Tips

**1. Use Playwright Trace Viewer**:
```bash
# Run with trace
npx playwright test --trace on

# Open trace viewer
npx playwright show-trace trace.zip
```

**2. Use Playwright Inspector**:
```bash
# Debug specific test
npx playwright test --debug e2e/real-auth.spec.ts
```

**3. Console Logs in Tests**:
```typescript
test('debug test', async ({ page }) => {
  // Log all console messages
  page.on('console', msg => console.log(msg.text()));

  // Log network requests
  page.on('request', req => console.log(req.url()));

  // Take screenshot on failure
  await page.screenshot({ path: 'debug.png' });
});
```

**4. Check Supabase Logs**:
- Go to Supabase Dashboard → Logs
- Filter by timestamp of test run
- Look for authentication errors

## Best Practices

### Test Design

✅ **DO**:
- Test user behavior, not implementation
- Use semantic selectors (`data-testid`, `role`, `aria-label`)
- Keep tests independent and idempotent
- Test happy paths AND edge cases
- Use shared utilities from `test-utils.ts`
- Clean up state after tests
- Add meaningful test descriptions

❌ **DON'T**:
- Rely on CSS selectors (they change frequently)
- Test implementation details
- Create dependencies between tests
- Use production data
- Leave test data in database
- Skip test cleanup
- Write tests without assertions

### Email Safety Checklist

Before ANY database operation:

- [ ] Are you using the test database?
- [ ] Is the email address valid and real?
- [ ] Did you run the email through `isValidEmail()`?
- [ ] Are you cleaning up test users after tests?
- [ ] Did you document the test user in this file?

### Performance

- Run tests in parallel when possible (`--workers=4`)
- Use `.skip` for flaky tests until fixed
- Keep test database small (cleanup regularly)
- Use `test.beforeAll` for expensive setup
- Reuse authentication state between tests

### Maintenance

- Review and update tests when features change
- Clean up test users weekly: `npm run test:cleanup-users`
- Monitor test execution time (keep under 5 minutes)
- Update test documentation when tests change
- Archive old test files to `e2e/archive/` (don't delete history)

## Test Coverage Goals

### Current Coverage (2025-10-30)

| Feature | E2E Tests | Status |
|---------|-----------|--------|
| **Authentication** | ✅ | Email/password + Google OAuth |
| **Flashcard Learning** | ✅ | Full user flow tested |
| **Progress Tracking** | ✅ | Leitner system, persistence |
| **Statistics** | ✅ | Accuracy, streaks |
| **Dark Mode** | ⚠️ | Manual testing only |
| **Responsive UI** | ⚠️ | Manual testing only |
| **Keyboard Shortcuts** | ⚠️ | Manual testing only |

### Planned Additions

- [ ] Unit tests for hooks (`useProgress`, `useKeyboard`)
- [ ] Unit tests for utilities (`emailValidator`, `wordService`)
- [ ] Visual regression tests with Percy
- [ ] Mobile-specific E2E tests
- [ ] Performance benchmarks
- [ ] Accessibility tests (WCAG 2.1 AA)

## Quick Reference

### Test Commands

| Command | Purpose |
|---------|---------|
| `npm run test:e2e` | Run all E2E tests |
| `npm run test:e2e:ui` | Interactive UI mode |
| `npm run test:e2e:headed` | See browser during tests |
| `npx playwright test --debug` | Debug mode |
| `npx playwright codegen` | Generate test code |

### Database Commands

| Command | Purpose |
|---------|---------|
| `npm run test:create-user` | Create safe test user |
| `npm run test:cleanup-users` | Clean test database |
| `npm run test:list-users` | List test users |
| `npm run prod:list-users` | Audit production (read-only) |

### Useful Playwright Flags

| Flag | Purpose |
|------|---------|
| `--headed` | Show browser |
| `--debug` | Step through tests |
| `--ui` | Interactive UI mode |
| `--project=chromium` | Run specific browser |
| `--grep="auth"` | Run tests matching pattern |
| `--workers=1` | Run tests serially |
| `--trace on` | Record trace |

## Related Documentation

- **[Architecture Guide](./ARCHITECTURE.md)** - Component structure and data flow
- **[Database Guide](./DATABASE.md)** - Schema and queries
- **[Authentication Guide](./AUTHENTICATION.md)** - OAuth flows and security
- **[Deployment Guide](./DEPLOYMENT.md)** - CI/CD and Vercel setup

## Additional Resources

- **[Playwright Docs](https://playwright.dev/)** - Official Playwright documentation
- **[Supabase Auth Docs](https://supabase.com/docs/guides/auth)** - Authentication guides
- **[Email Best Practices](docs/TESTING_BEST_PRACTICES.md)** - Detailed email safety guide
- **[Cleanup Procedures](docs/CLEANUP_PROCEDURES.md)** - Database maintenance

---

**Last Updated**: 2025-10-30
**Maintainer**: Development team with Claude Code assistance
**Test Status**: ✅ All tests passing (as of 2025-10-27)
