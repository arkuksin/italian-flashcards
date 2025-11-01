# Deployment Guide

Comprehensive documentation for deploying the Italian Flashcards application to Vercel, including CI/CD workflows, environment configuration, and deployment best practices.

## Table of Contents

- [Overview](#overview)
- [Deployment Architecture](#deployment-architecture)
- [Vercel Configuration](#vercel-configuration)
- [CI/CD Pipelines](#cicd-pipelines)
- [Environment Variables](#environment-variables)
- [Deployment Workflows](#deployment-workflows)
- [Monitoring & Debugging](#monitoring--debugging)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

The application is deployed to **Vercel** with automated CI/CD pipelines that:

- Deploy production on pushes to `main` branch
- Create preview deployments for pull requests
- Run E2E tests against preview deployments
- Use separate databases for production and test environments

### Deployment Environments

| Environment | Trigger | Database | Purpose |
|-------------|---------|----------|---------|
| **Production** | Push to `main` | Production DB | Live application for real users |
| **Preview** | Pull request | Test DB | Testing and review before merge |
| **Development** | Manual | Test DB | Manual testing and experiments |

## Deployment Architecture

```
GitHub Repository
    ├── main branch ────────────► Production Deploy (Vercel)
    │                              ├── Production Database
    │                              └── https://italian-flashcards.vercel.app
    │
    └── feature branch (PR) ────► Preview Deploy (Vercel)
                                   ├── Test Database
                                   ├── E2E Tests (Playwright)
                                   └── https://italian-flashcards-pr-X.vercel.app
```

### Key Components

1. **Vercel** - Hosting platform with automatic deployments
2. **GitHub Actions** - CI/CD automation
3. **Playwright** - E2E testing framework
4. **Supabase** - Backend with separate prod/test databases
5. **Environment Variables** - Configuration management

## Vercel Configuration

### Project Setup

**Vercel Project Details**:
- **Project Name**: italian-flashcards
- **Project ID**: `prj_MF9abEzyIQBMVraPsD3K81CXm3o6`
- **Team ID**: `team_u6SeJMdPvkQRESdCl2eN7f2F`
- **Production URL**: https://italian-flashcards-eight.vercel.app

### Build Settings

**File**: `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "framework": "vite",
  "installCommand": "npm install"
}
```

**Build Configuration**:
- **Framework**: Vite
- **Node Version**: 18.x
- **Package Manager**: npm
- **Output Directory**: `dist/`
- **Build Command**: `npm run build`

### Git Integration

**Connected Repository**: `arkuksin/italian-flashcards`

**Branch Deployments**:
- `main` → Production
- All other branches → Preview (on PR creation)

**Auto Deployments**:
- ✅ Production: Enabled (push to main)
- ✅ Preview: Enabled (pull requests)

## CI/CD Pipelines

### Pull Request Workflow

**File**: `.github/workflows/pr-e2e-tests.yml`

**Triggers**:
```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
```

**Workflow Steps**:

1. **Checkout Code**
   - Clone repository
   - Setup Node.js 18

2. **Deploy to Vercel Preview**
   ```bash
   vercel deploy --prebuilt --token=$VERCEL_TOKEN
   ```
   - Deploys PR to preview URL
   - Uses test database environment variables
   - Returns preview URL for testing

3. **Health Check**
   ```bash
   curl --fail $PREVIEW_URL
   ```
   - Verify deployment is accessible
   - Retry up to 3 times with backoff
   - Timeout after 5 minutes

4. **Run E2E Tests**
   ```bash
   npx playwright test --reporter=html,line
   ```
   - Execute all Playwright tests
   - Test against preview URL
   - Use test user credentials
   - Generate HTML report

5. **Comment on PR**
   - Post test results to PR
   - Include preview URL
   - Show test summary
   - Link to full report

6. **Cleanup**
   - Archive preview deployment
   - Delete temporary resources

**Concurrency Control**:
```yaml
concurrency:
  group: pr-e2e-${{ github.event.pull_request.number }}
  cancel-in-progress: true
```
- Only one workflow per PR
- New commits cancel previous runs
- Saves CI minutes

### Production Deployment Workflow

**File**: `.github/workflows/production-deploy.yml`

**Triggers**:
```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:  # Manual trigger
```

**Workflow Steps**:

1. **Checkout Code**
   - Clone main branch
   - Setup Node.js 18

2. **Build Application**
   ```bash
   npm install
   npm run build
   ```
   - Install dependencies
   - Run production build
   - Verify build succeeds

3. **Deploy to Vercel**
   ```bash
   vercel deploy --prod --token=$VERCEL_TOKEN
   ```
   - Deploy to production
   - Use production environment variables
   - Update production URL

4. **Post-Deployment Verification**
   - Health check production URL
   - Verify authentication works
   - Test critical user flows

## Environment Variables

### Vercel Dashboard Configuration

**Access**: Vercel Dashboard → Project → Settings → Environment Variables

#### Production Environment

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | `https://gjftooyqkmijlvqbkwdr.supabase.co` | Production database connection |
| `VITE_SUPABASE_ANON_KEY` | `<production_anon_key>` | Production database authentication |
| `NODE_ENV` | `production` | Node environment mode |

#### Preview Environment (PRs)

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | `https://slhyzoupwluxgasvapoc.supabase.co` | Test database connection |
| `VITE_SUPABASE_ANON_KEY` | `<test_anon_key>` | Test database authentication |
| `NODE_ENV` | `test` | Node environment mode |
| `VITE_TEST_MODE` | `true` | Enable test mode features |

#### Development Environment (Optional)

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | `https://slhyzoupwluxgasvapoc.supabase.co` | Test database connection |
| `VITE_SUPABASE_ANON_KEY` | `<test_anon_key>` | Test database authentication |
| `NODE_ENV` | `development` | Node environment mode |
| `VITE_TEST_MODE` | `true` | Enable test mode features |

### GitHub Secrets

**Access**: Repository → Settings → Secrets and variables → Actions

**Required Secrets**:
```bash
# Vercel Deployment
VERCEL_TOKEN=<vercel_personal_token>
VERCEL_ORG_ID=team_u6SeJMdPvkQRESdCl2eN7f2F
VERCEL_PROJECT_ID=prj_MF9abEzyIQBMVraPsD3K81CXm3o6

# Test User Credentials (for E2E tests)
TEST_USER_EMAIL=test-e2e@example.com
TEST_USER_PASSWORD=<test_user_password>
```

### Environment Variable Flow

```
GitHub Push
    ↓
GitHub Actions Workflow
    ↓
Vercel Deployment
    ↓
Environment-Specific Variables Applied
    ↓
Build with Correct Database Connection
    ↓
Deployed to URL
```

## Deployment Workflows

### Standard Pull Request Flow

1. **Create Feature Branch**:
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

2. **Open Pull Request**:
   - Go to GitHub repository
   - Click "New Pull Request"
   - Select `feature/new-feature` → `main`
   - Create PR

3. **Automatic Deployment**:
   - GitHub Actions triggers
   - Vercel creates preview deployment
   - E2E tests run against preview
   - Results commented on PR

4. **Review and Merge**:
   - Review code changes
   - Check E2E test results
   - Test preview deployment manually
   - Merge to main when ready

5. **Production Deployment**:
   - Merge triggers production workflow
   - Deploys to production automatically
   - Verify production health

### Hotfix Flow

For critical production bugs:

1. **Create Hotfix Branch**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-bug
   ```

2. **Fix and Test**:
   ```bash
   # Make fix
   git commit -m "fix: resolve critical bug"
   git push origin hotfix/critical-bug
   ```

3. **Fast-Track PR**:
   - Create PR with "hotfix" label
   - Quick code review
   - Run E2E tests on preview
   - Merge immediately if tests pass

4. **Verify Production**:
   - Monitor deployment
   - Check error logs
   - Verify bug is fixed
   - Communicate fix to users

### Manual Deployment

For special cases (rare):

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Monitoring & Debugging

### Vercel Dashboard

**Analytics**:
- Page views and unique visitors
- Response times and performance
- Error rates and status codes
- Geographic distribution

**Functions**:
- Function execution logs
- Cold start times
- Memory usage
- Invocation count

**Deployments**:
- Deployment history
- Build logs
- Source commits
- Deployment status

### Deployment Logs

**View Build Logs**:
1. Go to Vercel Dashboard
2. Select deployment
3. Click "View Function Logs" or "Build Logs"

**Common Log Locations**:
- Build output: Vercel Dashboard → Deployment → Build Logs
- Runtime errors: Vercel Dashboard → Deployment → Function Logs
- E2E test results: GitHub Actions → Workflow run → Test results

### Health Checks

**Production Health Check**:
```bash
curl -I https://italian-flashcards-eight.vercel.app

# Expected: HTTP/2 200
```

**Preview Health Check** (during PR workflow):
```bash
curl -I https://italian-flashcards-pr-123.vercel.app

# Expected: HTTP/2 200
```

**Automated Health Checks**:
- Vercel monitors uptime automatically
- E2E tests verify critical paths
- Alerts sent on failures

### Error Tracking

**Vercel Logs**:
```bash
# Via Vercel CLI
vercel logs <deployment-url>

# Filter by status
vercel logs <deployment-url> --since 1h
```

**Browser Console**:
```javascript
// Check environment in browser
console.log('Environment:', import.meta.env.MODE)
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Test Mode:', import.meta.env.VITE_TEST_MODE)
```

## Troubleshooting

### Common Issues

#### Deployment Fails During Build

**Symptoms**: Build fails with TypeScript errors or module not found

**Possible Causes**:
1. Missing dependencies in `package.json`
2. TypeScript errors in code
3. Environment variable issues

**Solution**:
```bash
# Test build locally
npm run build

# Check for TypeScript errors
npm run lint

# Verify all dependencies installed
npm install

# Check build logs in Vercel Dashboard
```

#### Preview Uses Wrong Database

**Symptoms**: E2E tests modify production data

**Possible Causes**:
1. Wrong environment variables in Vercel
2. Preview environment not configured
3. Environment variable caching

**Solution**:
1. Check Vercel Dashboard → Environment Variables
2. Verify Preview environment has test database URL
3. Redeploy preview to pick up changes:
   ```bash
   # Force redeploy
   git commit --allow-empty -m "chore: trigger redeploy"
   git push
   ```

#### E2E Tests Fail in CI but Pass Locally

**Symptoms**: Tests pass on local machine but fail in GitHub Actions

**Possible Causes**:
1. Different environment variables
2. Timing issues (slower CI environment)
3. Test database not seeded properly

**Solution**:
```bash
# Check GitHub Secrets match local .env
gh secret list

# Run tests with same timeout as CI
npx playwright test --timeout=60000

# Check test database has required data
npm run test:list-users
```

#### Production Deployment Stuck

**Symptoms**: Deployment shows "Building..." for >10 minutes

**Possible Causes**:
1. Vercel infrastructure issues
2. Build script hanging
3. Large bundle size

**Solution**:
1. Cancel deployment in Vercel Dashboard
2. Check Vercel status: https://www.vercel-status.com/
3. Try deploying again
4. Contact Vercel support if persists

### Debugging Checklist

When deployment fails:

- [ ] Check build logs in Vercel Dashboard
- [ ] Verify environment variables are set correctly
- [ ] Test build locally with `npm run build`
- [ ] Check TypeScript errors with `npm run lint`
- [ ] Verify dependencies are up to date
- [ ] Check for Vercel service issues
- [ ] Review recent code changes for breaking changes

## Best Practices

### Before Deploying

✅ **DO**:
- Run tests locally: `npm run test:e2e`
- Build and preview locally: `npm run build && npm run preview`
- Check TypeScript: `npm run lint`
- Review environment variables
- Test critical user flows manually
- Check database migrations are applied

❌ **DON'T**:
- Deploy directly to production without PR
- Skip E2E tests on preview deployments
- Use production database for testing
- Deploy with failing tests
- Make database schema changes without coordination
- Deploy on Friday afternoon (unless emergency)

### Pull Request Guidelines

1. **Small, Focused PRs** - Easier to review and test
2. **Descriptive Titles** - Clear what the PR does
3. **Test Coverage** - Add tests for new features
4. **Documentation Updates** - Update docs when needed
5. **Preview Testing** - Test preview deployment before merge

### Deployment Timing

**Best Times to Deploy**:
- ✅ Monday-Thursday morning (easier to monitor)
- ✅ After thorough testing
- ✅ When team is available to respond

**Avoid Deploying**:
- ❌ Friday afternoon (weekend debugging)
- ❌ During high traffic periods
- ❌ Right before holidays
- ❌ Without backup plan

### Monitoring After Deployment

**First 30 Minutes**:
- Monitor error rates in Vercel Dashboard
- Check user reports/feedback channels
- Verify critical paths work (login, flashcards, progress)
- Check database connection and queries

**First 24 Hours**:
- Monitor performance metrics
- Review user feedback
- Check for edge cases
- Verify email sending (Supabase)

### Rollback Strategy

If deployment causes issues:

1. **Immediate Rollback** (Vercel Dashboard):
   - Go to Deployments
   - Find previous working deployment
   - Click "Promote to Production"

2. **Git Rollback**:
   ```bash
   git revert HEAD
   git push origin main
   # Triggers new deployment with reverted changes
   ```

3. **Fix Forward** (preferred for minor issues):
   - Create hotfix branch
   - Fix issue quickly
   - Deploy through normal PR process

## Performance Optimization

### Build Optimization

**Current Settings**:
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js']
        }
      }
    }
  }
})
```

**Best Practices**:
- Code splitting for large dependencies
- Tree shaking to remove unused code
- Lazy loading for routes (planned)
- Image optimization (future)

### Caching Strategy

**Vercel Edge Caching**:
- Static assets: Cached globally
- API routes: Not cached by default
- Dynamic routes: Cache with proper headers

**Browser Caching**:
- Service worker for offline support (planned)
- LocalStorage for user preferences
- Cache authentication tokens

## Security Considerations

### Environment Variables

- ⚠️ Never commit `.env` files to git
- ⚠️ Never expose Supabase service role key
- ⚠️ Use environment-specific keys
- ⚠️ Rotate keys periodically

### HTTPS & SSL

- ✅ Vercel provides automatic HTTPS
- ✅ All traffic encrypted by default
- ✅ SSL certificates auto-renewed

### Access Control

**Vercel Team Access**:
- Limit who can deploy to production
- Use role-based permissions
- Audit deployment history

**GitHub Branch Protection**:
```bash
# Setup branch protection
npm run setup:branch-protection

# Verify protection rules
npm run verify:branch-protection
```

## Related Documentation

- **[Testing Guide](./TESTING.md)** - E2E tests and CI/CD testing
- **[Database Guide](./DATABASE.md)** - Database environments
- **[Architecture Guide](./ARCHITECTURE.md)** - Application structure
- **[Authentication Guide](./AUTHENTICATION.md)** - Auth configuration

## Additional Resources

- **[Vercel Documentation](https://vercel.com/docs)** - Official Vercel docs
- **[GitHub Actions Docs](https://docs.github.com/en/actions)** - CI/CD workflows
- **[Vite Deployment](https://vitejs.dev/guide/static-deploy)** - Vite build guide
- **[Vercel Status](https://www.vercel-status.com/)** - Service status page

---

**Last Updated**: 2025-10-30
**Maintainer**: Development team with Claude Code assistance
**Deployment Platform**: Vercel (Pro Plan)
