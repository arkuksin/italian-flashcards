# E2E Test Debugging Guide

This guide explains how to use the debugging test files to troubleshoot authentication issues in the Vercel preview environment.

## Overview

The tests are failing in GitHub Actions when running against Vercel preview deployments because they can't find the `[data-testid="auth-form-subtitle"]` element. These debugging tests help identify what's actually happening in the preview environment.

## Debugging Test Files

### 1. `vercel-preview-debug.spec.ts` - Comprehensive Analysis
**Purpose**: Complete environment analysis and debugging
**Use when**: You need detailed information about the entire application state

**What it captures**:
- Environment detection (Vercel, test mode, development vs production)
- Authentication flow state analysis
- Network request monitoring
- Console error capture
- DOM structure analysis
- Element highlighting screenshots

**Key features**:
- Tests multiple URL variations
- Monitors auth state changes over time
- Captures all console logs and network errors
- Provides comprehensive environment information

### 2. `preview-auth-elements.spec.ts` - Simple Element Detection
**Purpose**: Quick element detection and validation
**Use when**: You need immediate feedback on what elements are present

**What it captures**:
- All data-testid elements present on the page
- Authentication element status
- Text content analysis
- Simple retry logic with multiple attempts

**Key features**:
- Clear console output showing what's found/missing
- Tests the exact failing scenario from CI
- Multiple detection methods for the same element
- Focused debugging output

### 3. `vercel-url-specific.spec.ts` - Preview URL Analysis
**Purpose**: Vercel-specific environment testing
**Use when**: You need to understand what's different about the Vercel preview environment

**What it captures**:
- Preview URL pattern detection
- Network activity monitoring
- Environment variable analysis
- URL variation testing
- Performance timing data

## How to Use These Tests

### Option 1: Run Against Local Development (Quick Test)
```bash
# Start your dev server
npm run dev

# Run the debugging tests in a separate terminal
npx playwright test vercel-preview-debug.spec.ts --headed
npx playwright test preview-auth-elements.spec.ts --headed
```

### Option 2: Run Against Vercel Preview URL (Main Use Case)
```bash
# Set the preview URL and run tests
PLAYWRIGHT_TEST_BASE_URL="https://your-preview-url.vercel.app" npx playwright test vercel-preview-debug.spec.ts

# For the specific failing URL pattern:
PLAYWRIGHT_TEST_BASE_URL="https://italian-flashcards-git-test-environment-setup-arkuksins-projects.vercel.app" npx playwright test preview-auth-elements.spec.ts
```

### Option 3: Run in GitHub Actions (CI Environment)
The tests are designed to run in CI and will automatically detect the Vercel environment. Check the test artifacts for:
- Screenshots in `test-results/`
- Console logs in the GitHub Actions output
- Test results with detailed debugging information

## Understanding the Output

### Console Log Analysis
Look for these key indicators in the console output:

**✅ Normal Authentication Flow:**
```
🔐 AUTH ELEMENTS STATUS:
  - authLoading: ✅ FOUND  (Initial loading state)
  - authFormSubtitle: ✅ FOUND  (Login form visible)
  - emailInput: ✅ FOUND
  - passwordInput: ✅ FOUND
```

**❌ Problem Indicators:**
```
❌ ERROR: App is not in any expected authentication state!
Available test IDs: flashcard-app, protected-content
```

**🔍 Element Detection:**
```
🏷️ ALL DATA-TESTID ELEMENTS:
  - auth-loading (div) [VISIBLE]: "Checking authentication..."
  - auth-form-subtitle (p) [VISIBLE]: "Sign in to continue"
```

### Screenshot Analysis
Check these screenshots in `test-results/`:

- `vercel-debug-full-page.png` - Full page view
- `simple-auth-detection.png` - Current state when simple test runs
- `dom-analysis-with-highlights.png` - All data-testid elements highlighted in red
- `failing-test-scenario.png` - Exact state when the test fails

## Common Issues and Solutions

### Issue 1: App Stuck in Loading State
**Symptoms**: Only `auth-loading` element is visible
**Possible causes**:
- Supabase connection timeout
- Network issues in preview environment
- Environment variable misconfiguration

**Debug steps**:
1. Check network errors in console output
2. Look for Supabase-related error messages
3. Verify environment variables are set correctly

### Issue 2: No Authentication Elements Found
**Symptoms**: No auth-related data-testids found
**Possible causes**:
- React app not loading correctly
- JavaScript errors preventing component rendering
- Build issues in preview environment

**Debug steps**:
1. Check for JavaScript errors in console logs
2. Verify React root element exists
3. Check if any data-testid elements are present

### Issue 3: Wrong Authentication State
**Symptoms**: App shows authenticated state when it shouldn't
**Possible causes**:
- Test mode accidentally enabled
- Authentication bypass in preview environment
- Cached authentication state

**Debug steps**:
1. Check environment detection output
2. Verify test mode is not enabled
3. Clear browser storage and retry

## Environment Detection Logic

The tests analyze these conditions to understand the environment:

```javascript
// Test mode detection
const isTestMode = window.location.search.includes('test-mode=true') ||
                   document.body.getAttribute('data-test-mode') === 'true' ||
                   (window as any).VITE_TEST_MODE === 'true';

// Vercel detection
const isVercelPreview = window.location.hostname.includes('vercel.app') ||
                       window.location.hostname.includes('-git-');

// E2E test detection
const isPlaywrightE2E = navigator.userAgent.includes('Playwright') ||
                       navigator.userAgent.includes('HeadlessChrome') ||
                       window.navigator.webdriver === true;
```

## Interpreting GitHub Actions Output

When these tests run in GitHub Actions:

1. **Look for the Console Output Section**: All debugging information is logged to console
2. **Check Test Artifacts**: Screenshots and test results are uploaded as artifacts
3. **Analyze Environment Detection**: The tests will show if they detected the correct environment
4. **Review Network Activity**: Failed network requests often indicate the root cause

## Next Steps Based on Results

### If Elements Are Found But Test Still Fails:
- Check timing issues (elements might load after test runs)
- Verify element selector accuracy
- Look for text content mismatches

### If No Elements Are Found:
- App is likely not loading correctly
- Check for JavaScript errors
- Verify build and deployment process

### If Wrong Authentication State:
- Review authentication logic in AuthContext
- Check environment variable configuration
- Verify test mode detection is working correctly

## Running Specific Test Cases

```bash
# Test only the failing scenario
npx playwright test preview-auth-elements.spec.ts -g "verify the specific failing test case scenario"

# Test with multiple retries
npx playwright test preview-auth-elements.spec.ts -g "wait and retry element detection"

# Full environment analysis
npx playwright test vercel-preview-debug.spec.ts -g "comprehensive environment detection"

# Network and console logging
npx playwright test vercel-url-specific.spec.ts -g "capture console logs and errors"
```

## Contributing to Debug Tests

When adding new debugging capabilities:

1. **Add Clear Console Logging**: Use descriptive console.log statements
2. **Capture Screenshots**: Take screenshots at key decision points
3. **Document Expected vs Actual**: Always show what was expected and what was found
4. **Use Soft Assertions**: Use `expect.soft()` to continue test execution for debugging
5. **Structure Output**: Use clear headings and formatting for console output

## Troubleshooting the Debug Tests Themselves

If the debug tests aren't providing useful information:

1. **Check Test Timeout**: Increase timeout values if needed
2. **Verify Base URL**: Ensure PLAYWRIGHT_TEST_BASE_URL is set correctly
3. **Clear Browser State**: Make sure tests start with clean state
4. **Enable Headed Mode**: Run with `--headed` to see browser interactions