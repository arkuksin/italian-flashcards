# Branch Protection Setup Guide

## Overview

This guide explains how to protect your main branch on GitHub to ensure code quality and prevent direct pushes to production. Branch protection requires pull requests to pass E2E tests before merging.

## Quick Setup (Automated)

### Option 1: Use the Setup Script

```bash
# Make sure you have GitHub CLI installed and authenticated
npm run setup:branch-protection
```

This script will:
- ✅ Check prerequisites (GitHub CLI, authentication)
- 🔧 Configure branch protection rules automatically  
- 🛡️ Require E2E tests to pass before merging
- 👥 Require pull request reviews
- 🚫 Block force pushes and branch deletions
- ✔️ Verify the configuration

### Option 2: Manual GitHub Web Interface

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Branches**
3. Click **"Add branch protection rule"** 
4. Enter `main` as the branch name pattern
5. Enable these settings:
   - ☑️ **Require a pull request before merging**
     - ☑️ Require approvals: `1`
     - ☑️ Dismiss stale PR reviews when new commits are pushed
   - ☑️ **Require status checks to pass before merging**
     - ☑️ Require branches to be up to date before merging
     - Search and select: **"E2E Status Check"**
   - ☑️ **Restrict pushes that create files larger than 100 MB**
   - ☑️ **Do not allow bypassing the above settings**
6. Click **"Create"**

## Verification

### Automated Verification

```bash
# Check if branch protection is properly configured
npm run verify:branch-protection
```

This will analyze your configuration and provide a security score with recommendations.

### Manual Verification

1. **Create a test branch:**
   ```bash
   git checkout -b test-branch-protection
   echo "test" > test-file.txt
   git add test-file.txt
   git commit -m "Test branch protection"
   git push -u origin test-branch-protection
   ```

2. **Create a pull request** from `test-branch-protection` to `main`

3. **Verify the following behaviors:**
   - ✅ E2E tests run automatically
   - ✅ PR cannot be merged until tests pass
   - ✅ PR requires at least 1 approval
   - ✅ Status shows "Merging is blocked"

4. **Clean up:**
   ```bash
   git checkout main
   git branch -D test-branch-protection
   git push origin --delete test-branch-protection
   ```

## Branch Protection Features

### Required Status Checks

- **E2E Status Check**: Ensures end-to-end tests pass
- **Up-to-date branches**: Requires branches to be current with main
- **Strict checking**: New commits trigger re-validation

### Pull Request Reviews

- **Required approvals**: At least 1 approving review
- **Dismiss stale reviews**: New commits invalidate old approvals
- **Code owner reviews**: Optional (can be enabled for specific files)

### Push Restrictions

- **Force pushes blocked**: Prevents `git push --force`
- **Branch deletions blocked**: Prevents accidental deletion
- **Direct pushes blocked**: All changes must go through PRs

## E2E Testing Integration

### How It Works

1. **Trigger**: PR created or updated → E2E workflow starts
2. **Deploy**: Creates temporary Vercel preview deployment  
3. **Test**: Runs Playwright tests against preview
4. **Report**: Comments on PR with results
5. **Status**: Sets "E2E Status Check" to pass/fail
6. **Cleanup**: Removes preview deployment

### Workflow Jobs

- `deploy-preview`: Creates test environment
- `e2e-tests`: Runs tests in parallel (Chrome, Firefox, Safari)
- `test-results`: Processes and reports results
- `cleanup`: Removes preview deployment
- `status-check`: Final pass/fail status for branch protection

### Status Check Names

The branch protection rule looks for: **"E2E Status Check"**

This is defined in `.github/workflows/pr-e2e-tests.yml`:
```yaml
status-check:
  name: E2E Status Check  # ← This name must match
  runs-on: ubuntu-latest
  needs: [e2e-tests]
```

## Troubleshooting

### Common Issues

#### 1. E2E Status Check Not Found

**Problem**: Branch protection can't find "E2E Status Check"

**Solutions**:
- Verify the workflow file exists: `.github/workflows/pr-e2e-tests.yml`
- Check the status-check job name matches exactly
- Create a test PR to trigger the workflow first
- Wait for the workflow to run at least once

#### 2. GitHub CLI Authentication Issues

**Problem**: `gh auth status` fails

**Solutions**:
```bash
# Authenticate with GitHub
gh auth login

# Check authentication
gh auth status

# If needed, refresh token
gh auth refresh
```

#### 3. Missing Permissions

**Problem**: "Resource not accessible by integration"

**Solutions**:
- Ensure you have admin access to the repository
- Check if you're in the correct repository directory
- Verify GitHub CLI has necessary scopes

#### 4. Workflow Permissions

**Problem**: E2E workflow can't comment on PRs

**Solutions**:
Check workflow permissions in `.github/workflows/pr-e2e-tests.yml`:
```yaml
permissions:
  contents: read
  pull-requests: write
  issues: write  # Required for PR comments
```

### Debugging Commands

```bash
# Check current branch protection
gh api repos/:owner/:repo/branches/main/protection

# List available status checks (after some PRs)
gh api repos/:owner/:repo/commits/main/status

# View workflow runs
gh run list

# View specific workflow run
gh run view <run-id>
```

## Security Best Practices

### Recommended Configuration

- ✅ **Require status checks**: E2E tests must pass
- ✅ **Require PR reviews**: At least 1 approval
- ✅ **Dismiss stale reviews**: New commits require re-approval  
- ✅ **Block force pushes**: Prevents history rewriting
- ✅ **Block deletions**: Prevents accidental branch removal
- ⚠️ **Include administrators**: Consider enabling for maximum security

### Additional Protections

1. **Environment Protection**: Configure deployment environments
2. **Required Reviewers**: Specify required reviewers for sensitive changes
3. **CODEOWNERS**: Define code ownership for automatic review requests
4. **Signed Commits**: Require GPG-signed commits (optional)

### Monitoring

Set up notifications for:
- Failed E2E tests on main branch
- Force push attempts
- Branch protection rule changes
- Workflow failures

## Scripts Reference

### Available Commands

```bash
# Setup branch protection (automated)
npm run setup:branch-protection

# Verify branch protection configuration  
npm run verify:branch-protection

# Run E2E tests locally
npm run test:e2e

# Setup E2E testing environment
npm run setup:e2e
```

### Adding to package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "setup:branch-protection": "node scripts/setup-branch-protection.js",
    "verify:branch-protection": "node scripts/verify-branch-protection.js"
  }
}
```

## Manual GitHub Settings Path

If you prefer manual configuration:

1. Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/branches`
2. Click: **"Add branch protection rule"**
3. Configure as described in the manual setup section above

## Support

For issues with branch protection setup:

1. Run the verification script: `npm run verify:branch-protection`
2. Check this documentation for troubleshooting steps
3. Review GitHub's branch protection documentation
4. Check workflow logs in GitHub Actions
5. Open an issue in the repository

---

*This documentation is maintained alongside the branch protection scripts. Please update it when making changes to the protection configuration.*