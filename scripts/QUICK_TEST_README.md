# Quick E2E Testing Scripts

Fast local testing scripts for debugging E2E test issues without waiting 30 minutes for GitHub Actions.

## 🚀 Quick Start

### 1. Install Playwright Dependencies (One-time setup)

```bash
# Install Playwright browsers and system dependencies
npx playwright install chromium --with-deps
```

If you're on WSL/Linux and get permission errors:
```bash
sudo npx playwright install-deps
```

### 2. Run Your First Test

**Fastest Option - Test Locally (2 minutes):**
```bash
./scripts/test-local-build.sh
```

This builds your app and tests it on localhost. No Vercel, no delays.

---

## 📋 Available Scripts

### Option 1: Test Against Local Build ⚡ (~2 min)

**Best for:** Verifying your code works without Vercel complications

```bash
./scripts/test-local-build.sh
```

**What it does:**
- Builds app with test environment variables
- Serves on localhost:5173
- Runs E2E tests
- Shows results

**Debug mode:**
```bash
./scripts/test-local-build.sh --debug
```

---

### Option 2: Test Against Vercel Preview ⚡ (~30 sec)

**Best for:** Testing the actual deployed Vercel environment

```bash
./scripts/test-vercel-preview.sh
```

**What it does:**
- Finds latest Vercel preview deployment
- Runs E2E tests against it
- Uses bypass token if configured

**Debug mode:**
```bash
./scripts/test-vercel-preview.sh --debug
```

**Prerequisites:**
- Vercel CLI installed (script auto-installs)
- VERCEL_TOKEN configured (reads from `mcp-vercel-tools/.env`)

---

### Option 3: Visual Debugger 🐛 (~10 sec)

**Best for:** Seeing exactly what's happening in the browser

```bash
# Test local build
./scripts/debug-test.sh

# Test Vercel preview
./scripts/debug-test.sh --vercel

# Test specific URL
./scripts/debug-test.sh --url https://your-preview.vercel.app
```

**What it does:**
- Opens browser window (you can see it!)
- Launches Playwright Inspector
- Step through test line by line
- Inspect elements visually

**Tips:**
- Click ▶ to run step-by-step
- Hover over code to see elements highlighted
- Use browser DevTools alongside inspector

---

## ⚙️ Configuration

### Environment Variables

Copy the example and configure:
```bash
cp .env.playwright.local.example .env.playwright.local
```

Edit `.env.playwright.local`:
```bash
# Vercel (for preview testing)
VERCEL_TOKEN=your_vercel_token
VERCEL_BYPASS_TOKEN=your_bypass_token

# Supabase (already configured in .env.test.local)
VITE_SUPABASE_URL=https://slhyzoupwluxgasvapoc.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Note:** The scripts will auto-detect credentials from:
1. `.env.playwright.local`
2. `.env.test.local`
3. `mcp-vercel-tools/.env`

---

## 🎯 The Test File

All scripts run this minimal test:
```
e2e/quick-auth-check.spec.ts
```

**What it tests:**
- ✅ Can access the app
- ✅ No Vercel password protection blocking
- ✅ Auth form renders
- ✅ All auth elements present

**Runtime:** ~10 seconds (vs. 25+ minutes for full suite)

---

## 🔍 Troubleshooting

### "Host system is missing dependencies"

Run:
```bash
sudo npx playwright install-deps
```

Or on WSL:
```bash
sudo apt-get install libnspr4 libnss3 libasound2t64
```

### "No preview deployments found"

Create one:
```bash
git push  # Triggers auto-deployment
# OR
vercel deploy
```

### "Cannot find Vercel token"

Add to `mcp-vercel-tools/.env`:
```bash
VERCEL_API_TOKEN=your_token_here
```

Or set environment variable:
```bash
export VERCEL_TOKEN=your_token
./scripts/test-vercel-preview.sh
```

### Bypass token not working

Check Vercel dashboard:
1. Go to Settings → Deployment Protection
2. Copy the bypass token
3. Add to `.env.playwright.local`:
   ```bash
   VERCEL_BYPASS_TOKEN=your_token
   ```

---

## 📊 Comparison

| Method | Time | Best For |
|--------|------|----------|
| **GitHub Actions Pipeline** | 25-30 min | Final verification before merge |
| **test-local-build.sh** | ~2 min | Quick code verification |
| **test-vercel-preview.sh** | ~30 sec | Testing deployed environment |
| **debug-test.sh** | ~10 sec | Visual debugging |

---

## 💡 Workflow Examples

### Scenario 1: Code Changes

You made code changes and want to verify they work:

```bash
# Build and test locally (fastest)
./scripts/test-local-build.sh

# If tests pass, push to trigger full CI
git push
```

### Scenario 2: Vercel Issue Investigation

E2E tests failing in CI but you don't know why:

```bash
# Visual debug against Vercel preview
./scripts/debug-test.sh --vercel

# See exactly what page is being shown
# Step through test to find the issue
```

### Scenario 3: Password Protection Issue

Tests can't access the app:

```bash
# Test locally first (bypasses Vercel)
./scripts/test-local-build.sh

# If local works, test Vercel
./scripts/test-vercel-preview.sh

# If Vercel fails, it's likely password protection
```

---

## 🎓 Understanding the Scripts

### test-local-build.sh

```bash
npm run build                    # Build with test env vars
serve dist -l 5173              # Serve on localhost
playwright test                  # Run tests
```

### test-vercel-preview.sh

```bash
vercel ls                        # Find latest preview
playwright test --url={preview}  # Test against it
```

### debug-test.sh

```bash
playwright test --headed --debug  # Visual mode
```

---

## 📝 Results

All scripts save results to:
- `test-results/` - Screenshots, traces
- `playwright-report/` - HTML report

View report:
```bash
npx playwright show-report
```

---

## 🚨 Common Issues Solved

### Issue: "Tests take forever in CI"
**Solution:** Use these scripts locally first

### Issue: "Can't reproduce CI failures"
**Solution:** `./scripts/test-vercel-preview.sh` tests same environment

### Issue: "Don't know what's failing"
**Solution:** `./scripts/debug-test.sh --vercel` shows you visually

### Issue: "Is it Vercel or my code?"
**Solution:** Compare `test-local-build.sh` vs `test-vercel-preview.sh`

---

## 🔗 Related Files

- `e2e/quick-auth-check.spec.ts` - The test file
- `.env.test.local` - Test environment config
- `mcp-vercel-tools/.env` - Vercel credentials
- `playwright.config.ts` - Playwright configuration

---

**Created:** 2025-10-01
**Purpose:** Fast local E2E testing for PR #23 debugging
