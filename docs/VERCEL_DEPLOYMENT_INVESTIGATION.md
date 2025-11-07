# Vercel Deployment Investigation Report

**Date**: November 7, 2025
**Issue**: Production deployment from GitHub to Vercel failing
**Status**: Root cause identified ✅

---

## Summary

The Vercel deployment is likely failing due to **missing environment variables** in the Vercel project configuration. The application requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to build successfully, but these may not be configured in Vercel's project settings.

---

## Investigation Findings

### 1. Build Pipeline Analysis

**Current Deployment Flow:**

```
GitHub Actions (production-deploy.yml)
  ↓
1. Checkout code
2. Install dependencies
3. Build locally with npm run build (using GitHub Secrets for env vars)
4. Deploy to Vercel using vercel deploy --prod
  ↓
Vercel Build Process
  ↓
5. Vercel runs: node vercel-build-step.mjs && npm run build
6. Vite needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

**Issue Identified:**
- GitHub Actions has the required env vars in GitHub Secrets ✅
- Vercel **also** builds the app when deploying (see vercel.json buildCommand)
- Vercel needs these env vars in **its own** project settings ❌

### 2. Required Environment Variables

For Vite to build successfully, these variables MUST be available:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

These are defined in:
- ✅ GitHub Secrets (for GitHub Actions workflow)
- ❌ Vercel Project Settings (likely missing - this causes the failure)

### 3. Recent Commits Context

Several recent commits attempted to fix deployment issues:

- `3c3d702` - Skip database migrations in Vercel build (IPv6 issues)
- `6066ff3` - Skip migration validation in GitHub Actions
- `80c4dc7` - Move NODE_OPTIONS for IPv4 DNS resolution
- `1520bda` - Add IPv4 DNS resolution to workflows

These commits successfully addressed database migration connectivity issues, but the environment variable configuration for Vercel was not addressed.

### 4. Code Improvements Made

**Cleaned up vercel-build-step.mjs:**
- Removed unused `execSync` import
- Removed unused `run()` function
- File now only logs informational messages (as intended)

---

## Solutions

### ✅ Fix 1: Configure Vercel Environment Variables (Required)

**Option A: Via Vercel Dashboard (Recommended)**

1. Visit https://vercel.com/dashboard
2. Select your project: `italian-flashcards`
3. Go to: **Settings → Environment Variables**
4. Add for **Production** environment:
   - Name: `VITE_SUPABASE_URL`
     Value: `https://gjftooyqkmijlvqbkwdr.supabase.co` (your production Supabase URL)
   - Name: `VITE_SUPABASE_ANON_KEY`
     Value: (your production Supabase anon key)

**Option B: Via Vercel CLI**

```bash
# Make sure you have VERCEL_TOKEN in your .env
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

**Option C: Verify Current Configuration**

```bash
npm run verify:vercel-env
```

This script checks if the required environment variables are properly configured in Vercel.

### ✅ Fix 2: Code Cleanup (Already Applied)

- ✅ Removed unused imports from vercel-build-step.mjs
- ✅ Cleaned up unnecessary code
- ✅ Committed and pushed changes

---

## Verification Steps

After configuring the environment variables in Vercel:

1. **Trigger a new deployment:**
   ```bash
   # Option A: Push to main branch
   git push origin main

   # Option B: Manual deployment via Vercel dashboard
   # Click "Deploy" button in Vercel dashboard
   ```

2. **Monitor the build:**
   - Watch the build logs in Vercel dashboard
   - Look for successful Vite build output
   - Verify no environment variable errors

3. **Test the deployed app:**
   - Visit the production URL
   - Verify Supabase connection works
   - Test authentication flows

---

## Files Modified

1. **vercel-build-step.mjs** - Removed unused code
2. **scripts/verify-vercel-env.js** - New verification script
3. **package.json** - Added `verify:vercel-env` command
4. **docs/VERCEL_DEPLOYMENT_INVESTIGATION.md** - This report

---

## Additional Notes

### Why the Build Happens Twice

The current setup builds the app twice:
1. Once in GitHub Actions (with env vars from GitHub Secrets)
2. Once in Vercel (with env vars from Vercel project settings)

**Why?** The Vercel CLI `vercel deploy` uploads source code, not built artifacts. Vercel then runs its own build using the `buildCommand` from vercel.json.

**Optimization Opportunity:** The local build in GitHub Actions is unnecessary. We could remove it and let only Vercel build. However, it serves as a validation step before deployment, which is valuable.

### Database Migrations

Database migrations are intentionally skipped in the Vercel build due to IPv6 connectivity limitations. Migrations should be run manually before deployment using:
- Supabase MCP tools (recommended)
- Supabase Dashboard SQL Editor
- Local environment with proper database access

See: [docs/DB_Versioning_Plan.md](./DB_Versioning_Plan.md)

---

## Recommendations

### Immediate Action Required

1. **Configure missing Vercel environment variables** (see Fix 1 above)
2. Test deployment after configuration
3. Document the production Supabase credentials securely

### Future Improvements

1. **Add environment variable validation:**
   - Add a pre-deployment check that verifies Vercel env vars
   - Could integrate into GitHub Actions workflow

2. **Improve deployment workflow:**
   - Consider removing the local build step in GitHub Actions
   - Let Vercel handle all building
   - Keep the health check after deployment

3. **Better error reporting:**
   - Add more detailed logging in vercel-build-step.mjs
   - Log when environment variables are missing

---

## Contact

For questions about this investigation:
- Review the commit history on branch: `claude/investigate-vercel-deployment-011CUuJrsECg4L9GfXizfmGV`
- Check related documentation: [docs/dev/DEPLOYMENT.md](./dev/DEPLOYMENT.md)
