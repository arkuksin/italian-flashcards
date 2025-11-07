# Fix: Vercel Team Permissions Issue

**Problem ID:** CRITICAL-003
**Severity:** ⚠️ HIGH
**Estimated Time:** 10-30 minutes (depending on solution)
**Risk Level:** LOW (various safe solutions available)
**Date Created:** 2025-11-06

---

## Problem Statement

GitHub Actions deployment workflow is failing with error:

```
Error: Git author arkuksin@gmail.com must have access to the
team arkuksin's projects on Vercel to create deployments.
Learn more: https://vercel.com/docs/deployments/troubleshoot-project-collaboration
```

This means:
- The git commit author (`arkuksin@gmail.com`) is not a member of the Vercel team
- GitHub Actions can't deploy on behalf of this user
- Last 3 production deployments failed
- Manual Vercel deployments still work

---

## Impact & Risks

### Current Impact:
- 🔴 **HIGH**: Production deployments from GitHub Actions failing
- 🔴 **HIGH**: CI/CD pipeline broken
- 🟡 **MEDIUM**: Must deploy manually via Vercel CLI
- 🟢 **LOW**: Application still running (last good deploy)

### When Fixed:
- ✅ Automated deployments working
- ✅ Complete CI/CD pipeline
- ✅ Faster release cycles
- ✅ Reduced manual work

---

## Root Cause Analysis

### Why This Happens

Vercel requires that:
1. The git commit author email must match a team member's email
2. OR deployment must use a Vercel API token with proper permissions
3. OR project must not belong to a team (personal projects)

### Current Setup Issue

```bash
# Git commit author:
arkuksin@gmail.com

# Vercel team:
"arkuksin's projects"

# Problem: arkuksin@gmail.com is NOT a team member
```

---

## Solution Options

You have **3 different solutions** to choose from. Pick the one that fits best:

1. ✅ **RECOMMENDED**: Add user to Vercel team (easiest)
2. ⚠️ **ALTERNATIVE**: Use Vercel deploy token (more secure, more setup)
3. 🔄 **WORKAROUND**: Move project to personal account (if appropriate)

---

## Solution 1: Add User to Vercel Team (RECOMMENDED)

**Time:** 5-10 minutes
**Risk:** LOW
**Best for:** Team projects with multiple collaborators

### Prerequisites

- Vercel team owner/admin access
- `arkuksin@gmail.com` must have a Vercel account

### Steps

**1.1 Log into Vercel**

```bash
# Via browser:
open https://vercel.com/dashboard

# Or via CLI:
vercel login
```

**1.2 Navigate to Team Settings**

1. Click your profile icon (top right)
2. Select team: **"arkuksin's projects"**
3. Go to **Settings** → **Members**

Or direct link:
```bash
open https://vercel.com/teams/arkuksins-projects/settings/members
```

**1.3 Invite Team Member**

1. Click **"Invite Member"** button
2. Enter email: `arkuksin@gmail.com`
3. Set role: **"Member"** or **"Developer"**
   - Member: Can deploy, view projects
   - Developer: Can deploy, view, edit projects
4. Click **"Send Invite"**

**1.4 Accept Invitation**

1. Check email inbox for `arkuksin@gmail.com`
2. Click **"Accept Invitation"** in email
3. Confirm team membership in Vercel dashboard

**1.5 Verify Team Membership**

```bash
# Via CLI:
vercel teams list

# Should show "arkuksin's projects" with member status

# Via browser:
# Profile → Teams → Should see "arkuksin's projects"
```

### Verification

**Test deployment:**

```bash
# Trigger workflow manually
gh workflow run production-deploy.yml

# Or make a small change and push
git checkout -b test/vercel-permissions
echo "# Test Vercel permissions" >> README.md
git add README.md
git commit -m "test: verify Vercel team permissions fixed"
git push origin test/vercel-permissions

# Watch workflow
gh run list --workflow=production-deploy.yml --limit 1 --watch
```

**Expected result:**
```
✅ Deploy to Vercel Production - Success
✅ No "must have access to team" error
```

### Rollback

Not needed - safe operation. If needed:
1. Remove user from team in Vercel settings
2. User loses deployment access immediately

---

## Solution 2: Use Vercel Deploy Token (ALTERNATIVE)

**Time:** 20-30 minutes
**Risk:** LOW
**Best for:** Projects requiring strict access control

This solution uses a project-specific deploy token instead of user authentication.

### Prerequisites

- Vercel project access
- GitHub repository admin access

### Steps

**2.1 Create Vercel Deploy Token**

1. Go to Vercel Dashboard
2. Select project: **italian-flashcards**
3. Go to **Settings** → **Git**
4. Scroll to **Deploy Hooks**
5. Create a new deploy hook (optional, for webhook-based deploys)

OR better:

1. Go to account **Settings** → **Tokens**
2. Create new token: "GitHub Actions Deploy"
3. Scope: Project-specific (select italian-flashcards)
4. Click **Create**
5. **Copy token immediately** (shown only once)

Direct link:
```bash
open https://vercel.com/account/tokens
```

**2.2 Update GitHub Secret**

```bash
# Store the new token
gh secret set VERCEL_TOKEN --body "YOUR_NEW_TOKEN_HERE"
```

**2.3 Verify Token Has Project Access**

```bash
# Test with new token
VERCEL_TOKEN="your_new_token" vercel ls italian-flashcards

# Should show project without errors
```

**2.4 Update Workflow (if needed)**

Check `.github/workflows/production-deploy.yml` uses token correctly:

```yaml
- name: Deploy to Vercel Production
  run: |
    vercel deploy --prod --token="${{ secrets.VERCEL_TOKEN }}" --yes
```

Should already be correct, but verify.

### Verification

Same as Solution 1 - trigger workflow and verify it succeeds.

### Rollback

```bash
# Restore old token
gh secret set VERCEL_TOKEN --body "OLD_TOKEN_VALUE"

# Or remove token and use user auth
gh secret delete VERCEL_TOKEN
```

---

## Solution 3: Move Project to Personal Account (WORKAROUND)

**Time:** 10-15 minutes
**Risk:** MEDIUM (project ownership change)
**Best for:** Solo projects, if team not needed

⚠️ **CAUTION**: This changes project ownership and may affect billing, domains, team access.

### Prerequisites

- Vercel team owner access
- Personal Vercel account

### Steps

**3.1 Transfer Project to Personal Account**

1. Go to Vercel Dashboard
2. Select project: **italian-flashcards**
3. Go to **Settings** → **Advanced**
4. Scroll to **Transfer Project**
5. Select destination: **Personal Account**
6. Confirm transfer

**3.2 Update GitHub Secrets**

```bash
# Remove team ID (or update to personal account ID)
gh secret delete VERCEL_ORG_ID

# Or update to personal account
gh secret set VERCEL_ORG_ID --body "YOUR_PERSONAL_ACCOUNT_ID"

# Get your personal account ID:
vercel teams list
# Personal account shown at top
```

**3.3 Update Vercel Environment Variables**

If any env vars were team-scoped, they need to be re-added to personal project:

```bash
# List current env vars
vercel env ls

# If needed, re-add them
vercel env add SUPABASE_DB_HOST production
# Enter value when prompted
```

**3.4 Reconnect GitHub Integration**

1. Project Settings → Git
2. Disconnect current integration
3. Reconnect with personal account

### Verification

Trigger workflow and verify deployment succeeds.

### Rollback

Transfer project back to team:
1. Project Settings → Advanced → Transfer Project
2. Select "arkuksin's projects" team
3. Update GitHub secrets back to team IDs

---

## Comparison Matrix

| Criterion | Solution 1: Add to Team | Solution 2: Deploy Token | Solution 3: Move to Personal |
|-----------|------------------------|-------------------------|------------------------------|
| **Difficulty** | ⭐ Easy | ⭐⭐ Medium | ⭐⭐⭐ Complex |
| **Time** | 5-10 min | 20-30 min | 10-15 min |
| **Risk** | ✅ Low | ✅ Low | ⚠️ Medium |
| **Best for** | Teams | Security-sensitive | Solo projects |
| **Reversible** | ✅ Easy | ✅ Easy | ⚠️ Complex |
| **Cost impact** | ✅ None | ✅ None | ⚠️ May affect billing |
| **Team access** | ✅ Maintains | ✅ Maintains | ❌ Loses team access |

**Recommendation**: Use **Solution 1** unless you have specific security requirements for Solution 2.

---

## Post-Fix Checklist

After implementing chosen solution:

- [ ] Chosen solution implemented
- [ ] Test deployment triggered
- [ ] Workflow runs without "team access" error
- [ ] Production deployment succeeds
- [ ] Health check passes
- [ ] Team notified of changes
- [ ] Documentation updated (DEPLOYMENT.md)
- [ ] Token/credentials stored securely (if applicable)

---

## Common Issues & Solutions

### Issue 1: "VERCEL_TOKEN is invalid"

```bash
# Check token is set
gh secret list | grep VERCEL_TOKEN

# Token might be expired, create new one
# Follow Solution 2, step 2.1
```

### Issue 2: "Project not found"

```bash
# Check project ID is correct
gh secret list | grep VERCEL_PROJECT_ID

# Get correct project ID:
vercel ls
# Copy project ID from output

# Update secret:
gh secret set VERCEL_PROJECT_ID --body "prj_XXXXXXXXXXXXX"
```

### Issue 3: "Unauthorized: deployment requires team membership"

```bash
# Git author email doesn't match any team member
# Solutions:
# 1. Add git author to team (Solution 1)
# 2. Change commit author email to match team member
# 3. Use deploy token (Solution 2)

# Check current git author:
git config user.email

# Team members:
vercel teams list
```

### Issue 4: "Cannot access team resources"

```bash
# User might be invited but hasn't accepted
# Check email: arkuksin@gmail.com
# Look for Vercel invitation
# Click "Accept Invitation"

# Or resend invitation from team settings
```

### Issue 5: Still fails after adding to team

```bash
# Clear GitHub Actions cache
gh cache delete --all

# Re-run workflow
gh run rerun <run-id>

# Or trigger new deployment
git commit --allow-empty -m "chore: trigger deployment"
git push
```

---

## Understanding Vercel Team Permissions

### Team Roles

| Role | Deploy | View Logs | Edit Settings | Add Members | Billing |
|------|--------|-----------|--------------|-------------|---------|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Member** | ✅ | ✅ | ⚠️ Limited | ❌ | ❌ |
| **Viewer** | ❌ | ✅ | ❌ | ❌ | ❌ |

For GitHub Actions deployment, **Member** role is sufficient.

### Git Commit Author Matching

Vercel matches:
1. Git commit author email
2. Against team member emails
3. Must be exact match (case-insensitive)

Example:
```bash
# Git commit:
git commit --author="arkuksin <arkuksin@gmail.com>"

# Must match team member:
Team member: arkuksin@gmail.com ✅
Team member: arkuksin@example.com ❌
```

---

## Alternative: Vercel Deploy Hooks

Another option not covered above - use Vercel Deploy Hooks instead of GitHub Actions:

### Pros:
- No team permission issues
- Simpler setup
- Webhook-based

### Cons:
- Less control over deployment
- Can't run pre-deployment checks
- No migration validation

### Quick Setup:

1. Vercel Dashboard → Project → Settings → Git → Deploy Hooks
2. Create hook: "Production Deploy"
3. Copy webhook URL
4. GitHub → Settings → Webhooks → Add webhook
5. Paste URL, select "push" events

Not recommended for this project due to missing migration validation.

---

## Related Documentation

- [Vercel Team Collaboration](https://vercel.com/docs/teams-and-accounts/team-collaboration)
- [Vercel Deploy Tokens](https://vercel.com/docs/rest-api/authentication)
- [Troubleshooting Project Collaboration](https://vercel.com/docs/deployments/troubleshoot-project-collaboration)
- [Project DEPLOYMENT.md](../dev/DEPLOYMENT.md)

---

## Dependencies

This fix is independent but works better after:
- **CRITICAL-001**: GitHub Secrets Migration
- **CRITICAL-002**: Production Secrets Added

With all three fixes, the complete CI/CD pipeline will be operational.

---

**Status:** 🟡 IN PROGRESS (as of 2025-11-06)
**Recommended Solution:** Solution 1 (Add user to Vercel team)
**Assigned To:** DevOps Team / Vercel Admin
**Next Review:** After implementation
**Blocks:** Automated production deployments
