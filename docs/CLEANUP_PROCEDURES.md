# Cleanup Procedures - User & Email Management

**Last Updated**: 2025-10-09
**Purpose**: Maintain healthy databases and prevent email bounce issues

## Table of Contents

1. [Overview](#overview)
2. [Regular Maintenance Schedule](#regular-maintenance-schedule)
3. [Monthly: Test Database Cleanup](#monthly-test-database-cleanup)
4. [Quarterly: Production Audit](#quarterly-production-audit)
5. [After Incidents: Emergency Cleanup](#after-incidents-emergency-cleanup)
6. [Monitoring Bounce Rates](#monitoring-bounce-rates)
7. [Script Reference](#script-reference)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Regular cleanup prevents email bounce issues and keeps your Supabase databases healthy. This document provides step-by-step procedures for routine maintenance.

### Why Cleanup Matters

- ✅ **Prevents email bounces**: Removes test users with fake emails
- ✅ **Maintains database health**: Removes stale inactive accounts
- ✅ **Protects email privileges**: Keeps Supabase bounce rate at 0%
- ✅ **Improves performance**: Reduces unnecessary data

### Cleanup Philosophy

- **Test Database**: Clean aggressively (it's meant for testing)
- **Production Database**: Clean carefully (real user data)
- **Always preview first**: Use dry-run mode before deleting
- **Log everything**: Keep audit trails for compliance

---

## Regular Maintenance Schedule

| Frequency | Task | Estimated Time |
|-----------|------|----------------|
| **Weekly** | Monitor bounce logs | 5 minutes |
| **Monthly** | Clean test database | 10 minutes |
| **Quarterly** | Audit production database | 20 minutes |
| **After incident** | Emergency cleanup | 30 minutes |

### Calendar Reminders

Set up recurring reminders:
```
Weekly (Monday 9am): Check Supabase bounce logs
Monthly (1st of month): Run test database cleanup
Quarterly (Jan/Apr/Jul/Oct 1st): Production audit
```

---

## Monthly: Test Database Cleanup

**Purpose**: Remove stale test users from the test database
**Frequency**: Monthly (or as needed)
**Risk**: Low (test database only)

### Procedure

#### Step 1: Preview What Will Be Deleted

```bash
# Safe: Shows what would be deleted without actually deleting
npm run test:cleanup-users
```

**Expected Output**:
```
🧹 Automated Test User Cleanup

⚙️  Configuration:
   Database: test
   URL: https://slhyzoupwluxgasvapoc.supabase.co
   Mode: DRY RUN (no deletions)
   Older than: 7 days

📋 Users to clean up:

1. test@test.com
   ID: abc-123
   Created: 15 days ago
   Confirmed: No
   Last Sign In: Never
   Reasons:
     - Matches test email pattern
     - Never signed in
     - Email not confirmed
```

#### Step 2: Review the List

Carefully review all users marked for deletion:

```bash
# If you need to adjust criteria (e.g., older than 30 days)
node scripts/cleanup-test-users.js --database=test --older-than=30 --dry-run
```

#### Step 3: Execute Cleanup

```bash
# Actually delete the users
node scripts/cleanup-test-users.js --database=test
```

**Confirmation required**: You'll be prompted to confirm before deletion.

#### Step 4: Verify Results

```bash
# Check the log file
cat cleanup/automated-cleanup-{timestamp}.log

# Verify deletion count
# Should show summary: X deleted, Y errors
```

### What Gets Removed

Users matching **at least 2 of these criteria** (or matching test pattern):
- Never signed in
- Email not confirmed
- Created more than 7 days ago (configurable)
- Email matches test patterns (test@, fake@, invalid@, etc.)

### Typical Results

**Test Database**:
- Usually 5-20 users cleaned up per month
- All should be legitimate test accounts
- No real users should be affected (it's the test database!)

---

## Quarterly: Production Audit

**Purpose**: Identify and remove any test users in production database
**Frequency**: Every 3 months (January, April, July, October)
**Risk**: Medium (production data - be careful!)

### Procedure

#### Step 1: List All Production Users

```bash
# Generate audit report
npm run prod:list-users
```

**What happens**:
1. Connects to production Supabase
2. Lists all users with analysis
3. Identifies suspicious patterns
4. Creates `cleanup/production-users-audit.json`
5. Creates `cleanup/users-to-delete.json` template

**Expected Output**:
```
📊 Summary:

   Total Users:              42
   Created Last 7 Days:      3
   Created Last 30 Days:     8
   Unconfirmed Emails:       1
   Never Signed In:          2
   🚨 Suspicious Users:      0

✅ No suspicious users detected!
```

#### Step 2: Review the Audit File

```bash
# View full audit
cat cleanup/production-users-audit.json | less

# Check for suspicious users
cat cleanup/production-users-audit.json | jq '.users[] | select(.suspicious == true)'

# Look for test patterns
grep -i "test@\|fake@\|invalid@" cleanup/production-users-audit.json
```

#### Step 3: Manually Verify Suspicious Users

**If suspicious users found**:

1. **Verify they're actually test accounts**:
   - Check email domain
   - Look at creation date
   - Verify never signed in
   - Confirm email not confirmed

2. **Edit deletion list**:
   ```bash
   # Edit the deletion template
   nano cleanup/users-to-delete.json

   # Keep only users you verified should be deleted
   # Remove any legitimate users from the list
   ```

3. **Example deletion list**:
   ```json
   {
     "note": "Review this list carefully before running delete-invalid-users.js",
     "users": [
       {
         "id": "user-id-123",
         "email": "test@test.com",
         "reason": "Throwaway domain: @test.com"
       },
       {
         "id": "user-id-456",
         "email": "fake@example.com",
         "reason": "Throwaway domain: @example.com"
       }
     ]
   }
   ```

#### Step 4: Preview Deletion

```bash
# Safe: Preview what will be deleted
npm run prod:delete-users:dry-run
```

**Review carefully**: This will show details of each user before deletion.

#### Step 5: Execute Deletion

```bash
# Interactive mode: confirms each user
npm run prod:delete-users

# For each user, you'll be prompted:
# Delete this user? (yes/no):
```

#### Step 6: Verify and Document

```bash
# Check deletion log
cat cleanup/deletion-log-{timestamp}.txt

# Check backup file
cat cleanup/deleted-users-{timestamp}.json

# Document in your records:
# - Date of cleanup
# - Number of users deleted
# - Reason for deletion
```

### Typical Results

**Production Database**:
- Usually 0-2 users cleaned up per quarter
- Mostly from old testing/development
- Should be rare if prevention measures are working

---

## After Incidents: Emergency Cleanup

**When**: Received Supabase bounce warning email
**Priority**: High (within 24 hours)
**Risk**: Medium (careful but urgent)

### Procedure

#### Step 1: Check Bounce Logs

```bash
# In Supabase Dashboard:
# 1. Go to Authentication → Logs
# 2. Filter by event type: "Bounced"
# 3. Review last 7 days
# 4. Note problematic email addresses
```

See `cleanup/bounce-logs-check.md` for detailed monitoring guide.

#### Step 2: Immediate Production Audit

```bash
# Run audit immediately
npm run prod:list-users

# Look for users matching bounced emails
cat cleanup/production-users-audit.json | grep "{bounced-email}"
```

#### Step 3: Quick Cleanup

```bash
# Edit deletion list with bounced users
nano cleanup/users-to-delete.json

# Delete immediately
npm run prod:delete-users
```

#### Step 4: Monitor Improvement

```bash
# Wait 24 hours, then check bounce logs again
# Bounce rate should decrease
# Repeat if necessary
```

### Expected Timeline

- **0-24 hours**: Delete problematic users
- **24-48 hours**: Bounce rate starts improving
- **7 days**: Clean bounce history, Supabase restrictions lifted

---

## Monitoring Bounce Rates

### Weekly Check (5 minutes)

```bash
# In Supabase Dashboard:
# 1. Authentication → Logs
# 2. Filter: "Bounced"
# 3. Check count for last 7 days

# Goal: 0 bounced emails
```

### What to Look For

**🟢 Healthy** (No action needed):
- 0 bounces in last 7 days
- All users have confirmed emails
- No test patterns in user list

**🟡 Warning** (Monitor closely):
- 1-2 bounces in last 7 days
- Some unconfirmed emails (>7 days old)
- Increasing signup rate

**🔴 Action Required** (Cleanup immediately):
- 3+ bounces in last 7 days
- Many unconfirmed emails
- Test patterns detected in production

### Monitoring Commands

```bash
# Quick production health check
npm run prod:list-users | grep "Suspicious Users"

# Check recent signups
npm run prod:list-users | grep "Created Last 7 Days"

# Find unconfirmed emails
cat cleanup/production-users-audit.json | jq '.summary.unconfirmedEmails'
```

---

## Script Reference

### Available Scripts

| Script | Purpose | Safe for Prod? | Dry-Run Available? |
|--------|---------|----------------|-------------------|
| `create-test-user.js` | Create test user (no email) | ⚠️ Use test DB | N/A |
| `list-production-users.js` | Audit production users | ✅ Read-only | N/A |
| `delete-invalid-users.js` | Delete specific users | ⚠️ Requires confirmation | ✅ Yes (--dry-run) |
| `cleanup-test-users.js` | Automated cleanup | ✅ Has dry-run | ✅ Yes (--dry-run) |

### Command Reference

```bash
# Test database operations
npm run test:create-user              # Create test user
npm run test:cleanup-users            # Clean test DB (dry-run)
node scripts/cleanup-test-users.js --database=test  # Execute cleanup

# Production operations (read-only)
npm run prod:list-users               # Audit production

# Production operations (modify)
npm run prod:delete-users:dry-run     # Preview deletions
npm run prod:delete-users             # Execute deletions
npm run prod:cleanup-users            # Preview automated cleanup

# Advanced options
node scripts/cleanup-test-users.js --database=test --older-than=30
node scripts/cleanup-test-users.js --database=production --older-than=60 --dry-run
node scripts/delete-invalid-users.js --yes  # Auto-confirm (dangerous!)
```

### Script Flags

**cleanup-test-users.js**:
- `--database=production|test` (required)
- `--dry-run` (preview only)
- `--older-than=N` (days threshold, default: 7)
- `--auto-confirm` (skip prompts)

**delete-invalid-users.js**:
- `--dry-run` (preview only)
- `--yes` (auto-confirm, use carefully!)

---

## Troubleshooting

### Problem: Script Says "No Users to Clean Up"

**Possible Causes**:
1. Database is already clean
2. Criteria too strict (try `--older-than=30`)
3. Using wrong database

**Solution**:
```bash
# List all users to verify
npm run prod:list-users

# Try more lenient criteria
node scripts/cleanup-test-users.js --database=test --older-than=1 --dry-run
```

### Problem: Can't Delete User - "User Not Found"

**Possible Causes**:
1. User already deleted
2. Wrong user ID in deletion list
3. Database connection issue

**Solution**:
```bash
# Re-run audit to get fresh user list
npm run prod:list-users

# Verify user ID matches
cat cleanup/production-users-audit.json | grep "{user-id}"

# Check database connection
node scripts/verify-supabase.js
```

### Problem: Bounce Rate Not Improving

**After 48 hours of cleanup**:

1. **Verify all problematic users deleted**:
   ```bash
   npm run prod:list-users
   cat cleanup/production-users-audit.json | jq '.summary.suspiciousUsers'
   # Should be 0
   ```

2. **Check for new bounces**:
   - Supabase Dashboard → Authentication → Logs → Bounced
   - Look for new bounces after cleanup

3. **Review Supabase email config**:
   - See `cleanup/supabase-email-config.md`
   - Verify Site URL and Redirect URLs

4. **Consider custom SMTP**:
   - If bounce issues persist
   - Set up SendGrid, AWS SES, or Mailgun

### Problem: Deleted Wrong User

**If you accidentally deleted a real user**:

1. **Check backup file**:
   ```bash
   cat cleanup/deleted-users-{timestamp}.json
   ```

2. **User must recreate account**:
   - Unfortunately, user data is permanently deleted
   - User can sign up again with same email
   - Previous progress data is lost

3. **Prevention for future**:
   - Always use --dry-run first
   - Manually review deletion list
   - Never use --yes without verification

---

## Best Practices

### ✅ Do

- ✅ Run cleanup scripts during low-traffic periods
- ✅ Always preview with --dry-run first
- ✅ Keep deletion logs for audit trail
- ✅ Monitor bounce logs weekly
- ✅ Document all cleanup activities
- ✅ Review deletion lists carefully

### ❌ Don't

- ❌ Skip the preview step
- ❌ Use --yes flag without manual review
- ❌ Delete users without verifying they're test accounts
- ❌ Ignore bounce rate warnings
- ❌ Clean production without testing procedure on test DB first

---

## Maintenance Checklist

### Weekly (5 minutes)

- [ ] Check Supabase bounce logs (goal: 0 bounces)
- [ ] Quick visual check of Authentication → Users
- [ ] No action needed if all clear

### Monthly (10 minutes)

- [ ] Run test database cleanup preview
  ```bash
  npm run test:cleanup-users
  ```
- [ ] Review output, execute cleanup
  ```bash
  node scripts/cleanup-test-users.js --database=test
  ```
- [ ] Verify results in log file

### Quarterly (20 minutes)

- [ ] Run production audit
  ```bash
  npm run prod:list-users
  ```
- [ ] Review audit file for suspicious users
- [ ] If found, manually verify and delete
- [ ] Document cleanup in maintenance log
- [ ] Check bounce logs for improvement

### After Bounce Warning (30 minutes)

- [ ] Check bounce logs immediately
- [ ] Run production audit
- [ ] Identify problematic users
- [ ] Delete invalid users
- [ ] Monitor for 24-48 hours
- [ ] Verify bounce rate improves

---

## Related Documentation

- **[Testing Best Practices](./TESTING_BEST_PRACTICES.md)** - Prevent future issues
- **[E2E Authentication Testing](./E2E_AUTHENTICATION_TESTING.md)** - Test configuration
- **[Supabase Setup](./SUPABASE_SETUP.md)** - Database configuration
- **[Bounce Logs Check](../cleanup/bounce-logs-check.md)** - Monitoring guide
- **[Supabase Email Config](../cleanup/supabase-email-config.md)** - Email settings

---

## Support

If you need help:
1. Review this document thoroughly
2. Check related documentation
3. Review script error messages
4. Check Supabase Dashboard for clues
5. Contact Supabase support if bounce issues persist

---

**Last Updated**: 2025-10-09
**Maintainer**: Development Team
**Review Schedule**: Monthly
