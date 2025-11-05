# Testing Best Practices - Email Bounce Prevention

**Last Updated**: 2025-10-09
**Priority**: Critical for maintaining Supabase email sending privileges

## Table of Contents

1. [Why Email Bounces Matter](#why-email-bounces-matter)
2. [Email & Authentication Testing](#email--authentication-testing)
3. [Database Selection](#database-selection)
4. [Creating Test Users](#creating-test-users)
5. [E2E Testing](#e2e-testing)
6. [Cleanup & Maintenance](#cleanup--maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Quick Reference](#quick-reference)

---

## Why Email Bounces Matter

### The Problem

High email bounce rates can cause Supabase to **temporarily restrict your email sending privileges**. This means:

- ❌ Users can't sign up (no confirmation emails)
- ❌ Password resets don't work
- ❌ Account verification fails
- ❌ Your application is effectively broken for new users

### What Causes Bounces

Email bounces occur when confirmation emails can't be delivered:

1. **Invalid email addresses**: typos, non-existent domains
2. **Throwaway domains**: @test.com, @mailinator.com, etc.
3. **Test accounts created during development**: fake@example.com
4. **Full mailboxes**: legitimate but full
5. **Spam filters**: too many emails to non-existent addresses

### Bounce Rate Thresholds

| Bounce Rate | Status | Impact |
|-------------|--------|--------|
| 0-1% | 🟢 Excellent | No issues |
| 1-3% | 🟡 Warning | Monitor closely |
| 3-5% | 🟠 Concerning | Take action |
| 5%+ | 🔴 Critical | **Email sending restricted** |

**Goal**: Maintain 0% bounce rate through proper testing practices.

---

## Email & Authentication Testing

### ❌ Never Use These Email Domains

**NEVER** use these domains for testing in any database:

```
@test.com              @mailinator.com       @guerrillamail.com
@example.com           @temp-mail.org        @throwaway.email
@fakeinbox.com         @invalid.com          @yopmail.com
@10minutemail.com      @trashmail.com        @tempmail.com
@dispostable.com       @maildrop.cc
```

**Why**: These addresses bounce immediately, damaging your sender reputation.

### ❌ Never Use These Email Patterns

Avoid email addresses matching these patterns:

```
test@*                 fake@*                invalid@*
demo@*                 throwaway@*           temp@*
dummy@*                asdf@*                qwerty@*
```

**Why**: Our system now blocks these patterns automatically, but avoid them manually too.

### ✅ Approved Testing Methods

#### Method 1: Script-based Test User Creation (Recommended)

```bash
# Create test user without triggering emails
npm run test:create-user
```

**Advantages**:
- ✅ No email sent (bypasses confirmation)
- ✅ Works instantly
- ✅ Safe for any database
- ✅ Can be automated

**When to use**: Anytime you need a test user

#### Method 2: Real Email Addresses

Use real email addresses you control:

```
your.name@gmail.com
developer.test@yourcompany.com
```

**Advantages**:
- ✅ Tests the complete flow
- ✅ Can verify emails actually arrive
- ✅ No bounce risk

**When to use**: Testing full signup flow, email templates

#### Method 3: Email Aliases

Use Gmail's `+` alias feature:

```
yourname+test1@gmail.com
yourname+feature-testing@gmail.com
yourname+auth-test@gmail.com
```

**How it works**:
- All emails go to `yourname@gmail.com`
- Each `+suffix` is treated as unique by Supabase
- Easy to filter in Gmail

**Advantages**:
- ✅ One real inbox
- ✅ Unlimited unique addresses
- ✅ Easy cleanup (filter and delete)

**When to use**: Testing multiple signups, different user scenarios

#### Method 4: Dedicated Test Email Account

Set up a dedicated test email:

```
myapp-testing@gmail.com
```

**Advantages**:
- ✅ Separate from personal email
- ✅ Can share with team
- ✅ Easy to clean out

**When to use**: Team testing, QA environment

### ❌ What NOT to Do

```bash
# ❌ BAD: Creating test users with fake emails
# This will cause bounces!
signup('test@test.com', 'password')

# ❌ BAD: Testing signup flow repeatedly with throwaway domains
signup('fake@mailinator.com', 'password')

# ❌ BAD: Quick manual testing in production
# Use test database instead!
```

```bash
# ✅ GOOD: Use the script
npm run test:create-user

# ✅ GOOD: Use your real email with alias
signup('yourname+test@gmail.com', 'password')

# ✅ GOOD: Test against test database
# .env.local already configured correctly!
```

---

## Database Selection

### Test Database (Default for Development)

**URL**: `https://slhyzoupwluxgasvapoc.supabase.co`
**Configuration**: `.env.local` (already set up)

```bash
# In .env.local (already configured)
VITE_SUPABASE_URL=https://slhyzoupwluxgasvapoc.supabase.co
```

**Characteristics**:
- ✅ **Safe to experiment**: Create/delete users freely
- ✅ **Isolated**: No impact on production users
- ✅ **No consequences**: Bounces here don't affect production
- ✅ **Perfect for testing**: Try anything without worry

**When to use**:
- ✅ Local development (default)
- ✅ Testing new features
- ✅ E2E test runs
- ✅ Learning authentication flows

### Production Database (Use with Caution)

**URL**: `https://gjftooyqkmijlvqbkwdr.supabase.co`
**Configuration**: `.env.production.local` (create only when needed)

```bash
# Create this file ONLY when testing against production
cp .env.production.local.template .env.production.local
```

**Characteristics**:
- ⚠️ **Real users**: Contains actual user data
- ⚠️ **Bounces matter**: Affects email sending privileges
- ⚠️ **Use sparingly**: Only for final verification
- ⚠️ **Never commit**: Credentials must stay secret

**When to use**:
- ⚠️ Final pre-release testing
- ⚠️ Debugging production-specific issues
- ⚠️ Verifying production configuration

**Never use for**:
- ❌ Regular development
- ❌ Feature testing
- ❌ Learning/experiments
- ❌ Automated tests

### How to Switch Databases

```bash
# Default: Test database (no action needed)
npm run dev  # Uses .env.local → test database

# Temporarily use production (rare)
# 1. Create production config
cp .env.production.local.template .env.production.local

# 2. Start dev server (will use production)
npm run dev

# 3. When done, DELETE the file
rm .env.production.local
```

**⚠️ WARNING**: If `.env.production.local` exists, it takes precedence! Always delete it when done.

---

## Creating Test Users

### Recommended: Script-Based Creation

```bash
# Interactive mode (prompts for details)
npm run test:create-user
```

**What it does**:
1. Prompts for email and password
2. Connects to Supabase with service role key
3. Creates user with `email_confirm: true`
4. **No email sent** - confirmation bypassed
5. User is immediately active

**Example**:
```bash
$ npm run test:create-user

🚀 Supabase Test User Creation Script

Enter test user email (default: test-e2e@example.com): mytest@test.local
Enter test user password (default: TestPassword123!): MySecure123!

✅ Test user created successfully!
📧 Email: mytest@test.local
🔐 Password: MySecure123!
```

**Advantages**:
- ✅ No email confirmation needed
- ✅ Works instantly
- ✅ No bounce risk
- ✅ Can use any email format (even fake ones safely!)

### Manual Testing: Signup Flow

If you need to test the actual signup flow:

```bash
# 1. Ensure using test database
cat .env.local | grep VITE_SUPABASE_URL
# Should show: slhyzoupwluxgasvapoc.supabase.co

# 2. Use your REAL email with alias
# Navigate to app and sign up with:
yourname+testing@gmail.com

# 3. Check your email inbox
# Click confirmation link

# 4. Clean up afterwards
npm run test:cleanup-users
```

**Why use real email**:
- Tests the complete user journey
- Verifies emails actually arrive
- Checks email templates render correctly
- Confirms redirect URLs work

### What About E2E Tests?

✅ **Already configured correctly!**

Test user is pre-created in test database:
- Email: `test-e2e@example.com`
- Password: `TestPassword123!`
- Email confirmed: Yes (bypassed via script)

**No action needed** - E2E tests use this user automatically.

---

## E2E Testing

### Current Setup ✅

E2E tests are properly configured to avoid bounce issues:

```yaml
# .github/workflows/pr-e2e-tests.yml
- Uses test database (slhyzoupwluxgasvapoc)
- Test user pre-created with confirmation bypassed
- No emails triggered during test runs
- Production database never touched by tests
```

**Configuration**: See `docs/E2E_AUTHENTICATION_TESTING.md` for complete details.

### Running E2E Tests Locally

```bash
# 1. Ensure test database is configured
cat .env.local | grep VITE_SUPABASE_URL

# 2. Run tests
npm run test:e2e

# 3. Or with UI
npm run test:e2e:ui
```

**Test user credentials** (already in environment):
```bash
TEST_USER_EMAIL=test-e2e@example.com
TEST_USER_PASSWORD=TestPassword123!
```

### Creating Additional Test Users for E2E

```bash
# Use the script - safe and fast
npm run test:create-user

# Enter details:
Email: e2e-test-user-2@test.local
Password: TestPass456!

# Use in tests:
await page.fill('[data-testid="email-input"]', 'e2e-test-user-2@test.local');
```

---

## Cleanup & Maintenance

### Monthly: Test Database Cleanup

```bash
# Preview what would be deleted (safe)
npm run test:cleanup-users

# Review the output, then run cleanup
node scripts/cleanup-test-users.js --database=test
```

**What it removes**:
- Users who never signed in
- Unconfirmed emails older than 7 days
- Users matching test patterns

**Frequency**: Monthly or as needed

### Quarterly: Production Audit

```bash
# 1. List all production users
npm run prod:list-users

# 2. Review the audit file
cat cleanup/production-users-audit.json

# 3. Check for suspicious users
grep "suspicious.*true" cleanup/production-users-audit.json

# 4. If found, delete them
# Edit cleanup/users-to-delete.json
npm run prod:delete-users
```

**Frequency**: Every 3 months or after major releases

### Weekly: Monitor Bounce Rates

```bash
# In Supabase Dashboard:
# 1. Go to Authentication → Logs
# 2. Filter by event type: "Bounced"
# 3. Review last 7 days
# Goal: 0 bounced emails
```

**Set calendar reminder**: Every Monday morning

### After Every Feature: Cleanup Test Users

```bash
# After testing authentication features
npm run test:cleanup-users

# After manual testing
node scripts/cleanup-test-users.js --database=test --older-than=1
```

---

## Troubleshooting

### Problem: I Accidentally Created Test User in Production

**Symptoms**: Created user with fake email in production database

**Solution**:
```bash
# 1. List production users
npm run prod:list-users

# 2. Find the user in the audit file
cat cleanup/production-users-audit.json | grep "test@"

# 3. Add user ID to deletion list
# Edit cleanup/users-to-delete.json
nano cleanup/users-to-delete.json

# 4. Delete the user
npm run prod:delete-users

# 5. Monitor bounce logs for next 48 hours
```

**Prevention**: Always check which database you're connected to!

### Problem: Bounce Rate is Increasing

**Symptoms**: Supabase warning email about bounces

**Solution**:
```bash
# 1. Check bounce logs
# Dashboard → Authentication → Logs → Filter: "Bounced"

# 2. Identify problem users
npm run prod:list-users

# 3. Review suspicious users
cat cleanup/production-users-audit.json | jq '.users[] | select(.suspicious == true)'

# 4. Delete invalid users
# Edit cleanup/users-to-delete.json
npm run prod:delete-users

# 5. Wait 24-48 hours for improvement
```

**Timeline**: Bounce rates improve within 24-48 hours after cleanup.

### Problem: How Do I Know Which Database I'm Using?

**Solution**:
```bash
# Check .env.local
cat .env.local | grep VITE_SUPABASE_URL

# Test database: slhyzoupwluxgasvapoc
# Production database: gjftooyqkmijlvqbkwdr

# Or check in browser dev tools:
# Network tab → Look for supabase.co requests
```

**Tip**: Test database = safe, Production database = be careful!

### Problem: Email Validation is Blocking My Test

**Symptoms**: Can't sign up with test email in the app

**This is correct behavior!** The validation is protecting you.

**Solution**:
```bash
# For testing, use the script instead:
npm run test:create-user

# Or use a real email with alias:
yourname+test@gmail.com
```

**Why**: The validation prevents accidental bounce-causing signups.

### Problem: Need to Test Signup Flow End-to-End

**Solution**:
```bash
# 1. Use test database (already default)
npm run dev

# 2. Sign up with YOUR real email + alias
yourname+signup-test@gmail.com

# 3. Check your inbox for confirmation email
# 4. Click link to confirm

# 5. Clean up afterwards
npm run test:cleanup-users
```

---

## Quick Reference

### Safe Commands (Use Anytime)

```bash
# Create test user safely
npm run test:create-user

# Preview test database cleanup
npm run test:cleanup-users

# Audit production (read-only)
npm run prod:list-users

# Preview production cleanup
npm run prod:cleanup-users

# Preview deletions
npm run prod:delete-users:dry-run
```

### Database Quick Check

```bash
# Which database am I using?
cat .env.local | grep VITE_SUPABASE_URL

# Test: slhyzoupwluxgasvapoc (safe)
# Prod: gjftooyqkmijlvqbkwdr (careful!)
```

### Email Patterns Reference

**✅ Safe**:
- `yourname@gmail.com`
- `yourname+test@gmail.com`
- `developer@yourcompany.com`

**❌ Never Use**:
- `test@test.com`
- `fake@example.com`
- `anything@mailinator.com`

### Emergency Cleanup

```bash
# Quick production cleanup of obvious test users
npm run prod:list-users
# Review suspicious users
npm run prod:delete-users
# Follow prompts
```

---

## Related Documentation

- **[E2E Authentication Testing](./E2E_AUTHENTICATION_TESTING.md)** - E2E test configuration
- **[Cleanup Procedures](./CLEANUP_PROCEDURES.md)** - Maintenance procedures
- **[Supabase Setup](./SUPABASE_SETUP.md)** - Supabase configuration
- **[Bounce Logs Check](../cleanup/bounce-logs-check.md)** - Monitoring guide
- **[Supabase Email Config](../cleanup/supabase-email-config.md)** - Email settings

---

## Summary: Golden Rules

1. ✅ **Always use test database for development** (already default in `.env.local`)
2. ✅ **Create test users with `npm run test:create-user`** (no emails sent)
3. ✅ **Use real email addresses when testing signup flow** (your email + alias)
4. ❌ **Never use throwaway domains** (@test.com, @mailinator.com, etc.)
5. ❌ **Never create test users in production database**
6. 🔄 **Clean up test users monthly** (`npm run test:cleanup-users`)
7. 📊 **Monitor bounce logs weekly** (Supabase Dashboard)
8. 📚 **Read this document before testing authentication features**

**Remember**: Email bounces can break your entire application. These practices protect you!

---

**Questions or Issues?**
- See troubleshooting section above
- Check related documentation
- Review cleanup procedures

**Last Updated**: 2025-10-09
