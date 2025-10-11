# E2E Authentication Testing - Complete Setup Guide

**Last Updated**: 2025-10-04
**Status**: ✅ Working (All tests passing on PR #23)

## Quick Overview

This document explains how real authentication E2E testing works for the Italian Flashcards application. Tests use actual Supabase authentication against deployed Vercel Preview environments.

## Architecture Overview

```
GitHub Actions PR Workflow
    ↓
Deploy to Vercel Preview (with test database env vars)
    ↓
Run Playwright E2E Tests (with test user credentials)
    ↓
Tests authenticate against Test Supabase Database
    ↓
Cleanup Preview Deployment
```

## Supabase Configuration

### Two Separate Databases

**1. Production Database**
- **URL**: `https://gjftooyqkmijlvqbkwdr.supabase.co`
- **Anon Key**: `sb_publishable_YOUR_PRODUCTION_KEY_HERE`
- **Purpose**: Real user data, used in production deployments
- **Users**: Real application users

**2. Test Database**
- **URL**: `https://slhyzoupwluxgasvapoc.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsaHl6b3Vwd2x1eGdhc3ZhcG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMDY5OCwiZXhwIjoyMDc0NTc2Njk4fQ.hxK65OHKF8ScncLF7zlcu0qEYgKAqipmtAT2UySKVwg`
- **Purpose**: E2E testing, used in Vercel Preview deployments
- **Users**: Test users only (e.g., `test-e2e@example.com`)

### Test User Account

Created in the **test database** only:
- **Email**: `test-e2e@example.com`
- **Password**: `TestPassword123!`
- **Email Confirmed**: Yes (auto-confirmed for testing)
- **Metadata**: `{ name: 'E2E Test User' }`

## Environment Variables Configuration

### GitHub Actions Secrets

Located in: Repository Settings → Secrets and variables → Actions

**Required Secrets:**
```bash
# Vercel Deployment
VERCEL_TOKEN=ufjRDdqAeoxJF5U6r57qxb0F
VERCEL_ORG_ID=team_u6SeJMdPvkQRESdCl2eN7f2F
VERCEL_PROJECT_ID=prj_MF9abEzyIQBMVraPsD3K81CXm3o6

# Test User Credentials (for Playwright tests)
TEST_USER_EMAIL=test-e2e@example.com
TEST_USER_PASSWORD=TestPassword123!

# Test Database Configuration (for GitHub Secrets reference only)
VITE_SUPABASE_URL_TEST=https://slhyzoupwluxgasvapoc.supabase.co
VITE_SUPABASE_ANON_KEY_TEST=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note**: `VITE_SUPABASE_URL_TEST` and `VITE_SUPABASE_ANON_KEY_TEST` are defined but **NOT used** by the workflow anymore (as of the fix on 2025-10-04). Vercel builds with its own environment variables.

### Vercel Environment Variables

Located in: Vercel Dashboard → Project Settings → Environment Variables

**Preview Environment** (used for PR deployments):
```bash
VITE_SUPABASE_URL=https://slhyzoupwluxgasvapoc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=test
VITE_TEST_MODE=true
```

**Production Environment** (used for main branch):
```bash
VITE_SUPABASE_URL=https://gjftooyqkmijlvqbkwdr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_YOUR_PRODUCTION_KEY_HERE
```

### Local Development Environment

**For local E2E testing** (`.env.test.local`):
```bash
# Test database configuration
VITE_SUPABASE_URL=https://slhyzoupwluxgasvapoc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=test
VITE_TEST_MODE=true

# Test user credentials
TEST_USER_EMAIL=test-e2e@example.com
TEST_USER_PASSWORD=TestPassword123!
```

**For local development** (`.env.local`):
```bash
# Production database (or use test database for safe development)
VITE_SUPABASE_URL=https://gjftooyqkmijlvqbkwdr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_YOUR_PRODUCTION_KEY_HERE
```

## GitHub Actions Workflow

**File**: `.github/workflows/pr-e2e-tests.yml`

### Workflow Steps

**1. Deploy Preview Environment**
```yaml
- name: Install Vercel CLI
  run: npm install -g vercel@latest

- name: Deploy to Vercel Preview
  # Vercel builds with Preview environment variables from dashboard
  run: |
    DEPLOYMENT_URL=$(vercel deploy --token="${{ secrets.VERCEL_TOKEN }}" --yes | tail -1)
    vercel inspect "$DEPLOYMENT_URL" --token="${{ secrets.VERCEL_TOKEN }}" --wait
```

**Key Points:**
- ✅ **No local build step** - Vercel builds from source
- ✅ Vercel automatically uses **Preview environment variables** from dashboard
- ✅ These point to the **test database** (`slhyzoupwluxgasvapoc.supabase.co`)
- ✅ Health check ensures deployment is ready before tests run

**2. Run E2E Tests**
```yaml
- name: Run E2E tests
  env:
    PLAYWRIGHT_TEST_BASE_URL: ${{ needs.deploy-preview.outputs.preview-url }}
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
  run: npx playwright test --project=chromium --reporter=github
```

**Key Points:**
- ✅ Tests run against the **deployed Vercel Preview URL**
- ✅ Test credentials are passed via environment variables
- ✅ App is already built with test database configuration
- ✅ Only chromium browser for fast feedback (can expand to more browsers)

**3. Cleanup**
```yaml
- name: Remove preview deployment
  run: vercel rm "${{ needs.deploy-preview.outputs.deployment-id }}" --token="${{ secrets.VERCEL_TOKEN }}" --yes
```

## Playwright Test Configuration

**File**: `playwright.config.ts`

### Key Settings

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Timeouts optimized for CI + Vercel deployment
  timeout: 30000,        // 30 seconds per test
  expect: {
    timeout: 10000,      // 10 seconds for assertions
  },

  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Local dev server (only for non-CI runs)
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    timeout: 120 * 1000,
    env: {
      // Use test database for local E2E tests
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://slhyzoupwluxgasvapoc.supabase.co',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'eyJ...',
    },
  },
});
```

**Important Notes:**
- In CI: Uses `PLAYWRIGHT_TEST_BASE_URL` (Vercel Preview URL)
- Locally: Starts dev server with test database configuration
- Timeouts increased from 20s/8s to 30s/10s to handle CI + Vercel deployment latency

## E2E Test Suite

**File**: `e2e/real-auth.spec.ts`

### Test Cases

```typescript
test.describe('Real Authentication Flow', () => {
  // Prerequisites check
  test.skip(!hasRealAuthConfig, 'Skipping real auth tests - missing credentials');

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/', { timeout: 30000 });
  });

  // 1. Basic Authentication
  test('should successfully sign in with test user credentials', async ({ page }) => {
    // Verify login form appears
    await expect(page.locator('text=Sign in to continue')).toBeVisible({ timeout: 15000 });

    // Fill credentials
    await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD);
    await page.click('[data-testid="submit-button"]');

    // Verify authentication succeeded
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Italian FlashCards' })).toBeVisible();
  });

  // 2. Session Persistence
  test('should maintain authentication state across page refreshes', async ({ page }) => {
    // Sign in, refresh, verify still authenticated
  });

  // 3. Protected Content Access
  test('should successfully access flashcard functionality after real authentication', async ({ page }) => {
    // Sign in, start learning session, test flashcard interactions
  });

  // 4. Sign Out
  test('should successfully sign out', async ({ page }) => {
    // Sign in, sign out, verify returned to login
  });

  // 5. Error Handling
  test('should handle invalid credentials appropriately', async ({ page }) => {
    // Try invalid credentials, verify error message appears
  });

  // 6. OAuth UI
  test('should work with social authentication buttons (visual check)', async ({ page }) => {
    // Verify Google/GitHub buttons are present and enabled
  });
});

test.describe('Real Authentication - Error Scenarios', () => {
  // 7. Network Errors
  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept auth requests, simulate failure
  });

  // 8. Session Expiration
  test('should handle session expiration', async ({ page }) => {
    // Verify loading state and session checks work
  });
});
```

## Authentication Flow

### 1. Initial Load
```
User visits app
    ↓
AuthContext loads (src/contexts/AuthContext.tsx)
    ↓
Check environment (CI/Playwright/production)
    ↓
Call supabase.auth.getSession()
    ↓
If no session → Show LoginForm
If session exists → Show protected content
```

### 2. Sign In
```
User enters email/password
    ↓
LoginForm.handleSubmit() calls signInWithEmail()
    ↓
AuthContext.signInWithEmail() calls supabase.auth.signInWithPassword()
    ↓
Supabase authenticates against configured database
    ↓
On success: AuthContext updates user/session state
    ↓
ProtectedRoute detects user → Renders children (flashcard app)
```

### 3. E2E Test Detection

**AuthContext.tsx** has smart environment detection:
```typescript
const isPlaywrightE2E =
  navigator.userAgent.includes('Playwright') ||
  navigator.userAgent.includes('HeadlessChrome') ||
  window.navigator.webdriver === true;

const isUnitTestMode =
  (isVitestTest || isJestTest) &&
  !isPlaywrightE2E &&           // Never mock for E2E tests
  !isProductionBuild &&
  !isVercelPreview &&
  !isCI;

if (isUnitTestMode) {
  // Provide mock user (ONLY for unit tests, NOT E2E)
} else {
  // Real Supabase authentication
  await supabase.auth.getSession()
}
```

**Critical**: E2E tests ALWAYS use real Supabase authentication, never mocks.

## Component Test IDs

**LoginForm** (`src/components/auth/LoginForm.tsx`):
- `[data-testid="email-input"]` - Email input field
- `[data-testid="password-input"]` - Password input field
- `[data-testid="submit-button"]` - Sign in/Sign up button
- `[data-testid="error-message"]` - Error message display
- `[data-testid="success-message"]` - Success message display
- `[data-testid="google-login-button"]` - Google OAuth button
- `[data-testid="github-login-button"]` - GitHub OAuth button
- `[data-testid="toggle-auth-mode"]` - Toggle sign in/sign up

**ProtectedRoute** (`src/components/ProtectedRoute.tsx`):
- `[data-testid="auth-loading"]` - Loading state during auth check
- `[data-testid="protected-content"]` - Wrapper for authenticated content

**Header** (`src/components/Header.tsx`):
- `[data-testid="sign-out-button"]` - Sign out button (when authenticated)

## Troubleshooting

### Tests Fail Locally

**Symptom**: Tests timeout when run locally
**Cause**: Dev server not running or using wrong database
**Solution**:
1. Ensure `.env.test.local` exists with test database credentials
2. Run `npm run dev` in a separate terminal
3. Or let Playwright start the dev server automatically

### Tests Fail in CI

**Symptom**: Tests fail on GitHub Actions but pass locally
**Cause**: Usually timeout or incorrect environment variables
**Solution**:
1. Check Vercel Preview environment variables match test database
2. Verify GitHub secrets `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` are set
3. Check workflow logs for deployment URL and test output
4. Increase timeouts if needed in `playwright.config.ts`

### Authentication Fails

**Symptom**: Login form appears but authentication fails
**Cause**: Wrong database or test user not created
**Solution**:
1. Verify Vercel Preview env vars point to test database (`slhyzoupwluxgasvapoc.supabase.co`)
2. Verify test user exists in test database Auth > Users
3. Check Supabase logs for authentication errors

### Wrong Database Used

**Symptom**: Tests authenticate against production database
**Cause**: Vercel Preview environment variables misconfigured
**Solution**:
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Verify **Preview** environment has:
   - `VITE_SUPABASE_URL=https://slhyzoupwluxgasvapoc.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=eyJ...` (test database anon key)
3. Verify **Production** environment has production database credentials
4. Redeploy to pick up changes

## Verification Commands

### Check Vercel Environment Variables
```bash
vercel env ls --token="YOUR_VERCEL_TOKEN" --scope=YOUR_ORG_ID
vercel env pull .env.vercel.preview --environment=preview
vercel env pull .env.vercel.production --environment=production
```

### Check Recent Deployments
```bash
vercel ls --token="YOUR_VERCEL_TOKEN"
```

### View GitHub Actions Run
```bash
# Using GitHub CLI (if installed)
gh run list --repo arkuksin/italian-flashcards --limit 5
gh run view RUN_ID --log

# Or use GitHub API
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/arkuksin/italian-flashcards/actions/runs
```

### Run Tests Locally Against Deployed Preview
```bash
# Set the preview URL
export PLAYWRIGHT_TEST_BASE_URL="https://your-preview-url.vercel.app"

# Run tests
npx playwright test e2e/real-auth.spec.ts --project=chromium
```

### Manual Test of Deployed App
1. Get latest preview URL from Vercel or GitHub Actions logs
2. Open URL in browser
3. Should see login form with "Sign in to continue"
4. Enter: `test-e2e@example.com` / `TestPassword123!`
5. Should see flashcard app after successful authentication

## Key Files Reference

```
.github/workflows/
  └── pr-e2e-tests.yml          # Main E2E test workflow

e2e/
  ├── real-auth.spec.ts         # Real authentication tests
  └── quick-auth-check.spec.ts  # Quick smoke tests

src/
  ├── contexts/
  │   └── AuthContext.tsx       # Auth state management & Supabase integration
  ├── components/
  │   ├── auth/
  │   │   └── LoginForm.tsx     # Login/signup UI
  │   └── ProtectedRoute.tsx    # Authentication gate
  └── lib/
      ├── supabase.ts           # Supabase client initialization
      └── env.ts                # Environment variable validation

playwright.config.ts            # Playwright configuration
.env.test.local                 # Local test environment variables
```

## Recent Fixes (2025-10-04)

**Problem**: E2E tests were failing on PR #23
**Root Cause**:
- Workflow was doing a redundant local build before Vercel deployment
- Insufficient timeouts for CI environment + Vercel deployment latency
- Not an environment variable issue (they were already correct)

**Solution**:
1. Removed redundant local build step from workflow
2. Let Vercel build with its own (correct) Preview environment variables
3. Increased test timeout from 20s → 30s
4. Increased assertion timeout from 8s → 10s
5. Added explicit 30s timeout to `page.goto()` in tests

**Result**: All tests passing ✅

**Commit**: `3cfbb028` - "fix: correct E2E test workflow to use Vercel's Preview environment variables"

## Email Bounce Prevention (Added 2025-10-09)

### Background

Supabase temporarily flagged our production project due to high bounce rates from test emails sent to invalid addresses during development. Email bounces occur when confirmation emails can't be delivered (e.g., to fake domains like @test.com), and high bounce rates can cause Supabase to restrict email sending privileges.

### Prevention Measures Implemented

1. ✅ **E2E tests use test database with pre-confirmed user**
   - Tests run against `slhyzoupwluxgasvapoc.supabase.co` (test database)
   - Completely isolated from production (`gjftooyqkmijlvqbkwdr.supabase.co`)
   - No impact on production bounce rates

2. ✅ **Test user created via admin API (bypasses email)**
   - User created with `email_confirm: true` via `scripts/create-test-user.js`
   - No confirmation email sent during user creation
   - Zero bounce risk from E2E test setup

3. ✅ **No confirmation emails triggered during automated tests**
   - Tests use pre-existing test user for all authentication scenarios
   - No signup tests that would trigger email confirmations
   - Login-only flow for all E2E test cases

4. ✅ **Production database isolated from testing activities**
   - Local development uses test database by default (`.env.local`)
   - CI/CD E2E tests use test database (Vercel Preview environment)
   - Production database only used for actual production deployments

5. ✅ **Email validation on signup forms**
   - `src/lib/emailValidator.ts` blocks throwaway domains
   - Prevents accidental signup with fake emails
   - Shows helpful error messages to users

### Best Practices

**Never manually create test users in production**:
```bash
# ❌ BAD: Manual signup in production with fake email
# This causes bounces!

# ✅ GOOD: Use the script with test database
npm run test:create-user
```

**Use `scripts/create-test-user.js` for test user creation**:
```bash
# Safe: No email confirmation sent
node scripts/create-test-user.js
```

**Run tests against test database only**:
```bash
# E2E tests automatically use test database
npm run test:e2e

# Verify which database is being used:
cat .env.local | grep VITE_SUPABASE_URL
# Should show: slhyzoupwluxgasvapoc.supabase.co
```

**See `docs/TESTING_BEST_PRACTICES.md` for complete guidelines**:
- Email testing best practices
- Database selection guide
- Cleanup procedures
- Troubleshooting

### Monitoring

**Bounce logs should show 0 bounces for test database**:
- Test database is isolated and only used for testing
- No production users affected by test activities
- Safe to experiment without bounce consequences

**Production bounce rate should remain at 0%**:
- Supabase Dashboard → Authentication → Logs → Bounced
- Goal: 0 bounced emails per week
- Weekly monitoring recommended

**Regular audits via `npm run prod:list-users`**:
```bash
# Audit production users quarterly
npm run prod:list-users

# Review for any test users that shouldn't be there
cat cleanup/production-users-audit.json | grep "suspicious"

# Clean up if needed
npm run prod:delete-users
```

### Related Documentation

- **[Testing Best Practices](./TESTING_BEST_PRACTICES.md)** - Complete testing guidelines
- **[Cleanup Procedures](./CLEANUP_PROCEDURES.md)** - Maintenance procedures
- **[Bounce Logs Check](../cleanup/bounce-logs-check.md)** - Monitoring guide
- **[Supabase Email Config](../cleanup/supabase-email-config.md)** - Email settings

### Impact

**Before**:
- ❌ Risk of test emails bouncing in production
- ❌ Manual test user creation could cause bounces
- ❌ No validation on signup forms

**After**:
- ✅ Complete isolation: test database for all testing
- ✅ Script-based user creation bypasses email
- ✅ Email validation blocks throwaway domains
- ✅ Zero bounce risk from E2E tests
- ✅ Production database protected

## Success Metrics

**Latest Run** (as of 2025-10-04):
- ✅ Deploy Preview Environment: Success
- ✅ Run E2E Tests (chromium): Success (8/8 tests passed)
- ✅ E2E Status Check: Success
- ✅ Process Test Results: Success
- ✅ Cleanup Preview Environment: Success (skipped, as expected)

**Run URL**: https://github.com/arkuksin/italian-flashcards/actions/runs/18241139238

All real authentication tests are working correctly!
