# Database Migration Credentials Setup Guide

This guide explains how to configure database credentials for the migration system in GitHub Actions and Vercel.

## Understanding the Difference

### Application Credentials (What You Already Have)

These are used by your **React application** to connect to Supabase API:

- `VITE_SUPABASE_URL` - Supabase API URL
- `VITE_SUPABASE_ANON_KEY` - Public anonymous API key
- `VITE_SUPABASE_URL_TEST` - Test database API URL
- `VITE_SUPABASE_ANON_KEY_TEST` - Test database anon key

### Database Credentials (What Migrations Need)

These are used by the **migration runner** to connect directly to PostgreSQL:

- `SUPABASE_DB_HOST` - Direct PostgreSQL host
- `SUPABASE_DB_PORT` - PostgreSQL port (5432)
- `SUPABASE_DB_DATABASE` - Database name (postgres)
- `SUPABASE_DB_USER` - Database user (postgres)
- `SUPABASE_DB_PASSWORD` - Database password
- `SUPABASE_DB_SSL` - SSL enabled (true)
- `SUPABASE_DB_SSL_REJECT_UNAUTHORIZED` - SSL validation (false)

## Getting Database Credentials from Supabase

### Step 1: Access Supabase Dashboard

#### For Test Database:
1. Go to https://supabase.com/dashboard/project/slhyzoupwluxgasvapoc
2. Navigate to **Settings** → **Database**
3. Scroll to **Connection string** section
4. Look for **Connection pooling** or **Direct connection**

#### For Production Database:
1. Go to https://supabase.com/dashboard/project/gjftooyqkmijlvqbkwdr
2. Same steps as above

### Step 2: Extract Connection Details

The connection string looks like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.slhyzoupwluxgasvapoc.supabase.co:5432/postgres
```

Extract these values:
- **Host:** `db.slhyzoupwluxgasvapoc.supabase.co` (part after `@` and before `:5432`)
- **Port:** `5432`
- **Database:** `postgres` (part after last `/`)
- **User:** `postgres` (part before `:` and `@`)
- **Password:** The password shown in the connection string

### Step 3: Note Important Settings

- **Use direct database connection**, not the pooler URL
- **SSL must be enabled** for Supabase-hosted databases
- **SSL certificate validation** should be disabled (Supabase manages certificates)

## Setting Up GitHub Secrets

### Required Secrets for CI/CD

Add these **7 secrets** to your GitHub repository:

| Secret Name | Value | Example |
|------------|-------|---------|
| `SUPABASE_DB_HOST` | Database host | `db.slhyzoupwluxgasvapoc.supabase.co` |
| `SUPABASE_DB_PORT` | Port number | `5432` |
| `SUPABASE_DB_DATABASE` | Database name | `postgres` |
| `SUPABASE_DB_USER` | Username | `postgres` |
| `SUPABASE_DB_PASSWORD` | Your database password | `your_password_here` |
| `SUPABASE_DB_SSL` | Enable SSL | `true` |
| `SUPABASE_DB_SSL_REJECT_UNAUTHORIZED` | SSL validation | `false` |

### How to Add GitHub Secrets

1. **Navigate to Repository Settings:**
   - Go to your GitHub repository
   - Click **Settings** (top menu)
   - In the left sidebar, click **Secrets and variables** → **Actions**

2. **Add Each Secret:**
   - Click **New repository secret**
   - Enter the **Name** (e.g., `SUPABASE_DB_HOST`)
   - Enter the **Value** (e.g., `db.slhyzoupwluxgasvapoc.supabase.co`)
   - Click **Add secret**
   - Repeat for all 7 secrets

3. **Use Test Database for CI/CD:**
   - Use credentials from the **test database** (`slhyzoupwluxgasvapoc`)
   - This keeps CI/CD validation safe and isolated from production

### Verify GitHub Secrets

After adding all secrets, you should see:

```
SUPABASE_DB_HOST                 Updated X minutes ago
SUPABASE_DB_PORT                 Updated X minutes ago
SUPABASE_DB_DATABASE             Updated X minutes ago
SUPABASE_DB_USER                 Updated X minutes ago
SUPABASE_DB_PASSWORD             Updated X minutes ago
SUPABASE_DB_SSL                  Updated X minutes ago
SUPABASE_DB_SSL_REJECT_UNAUTHORIZED  Updated X minutes ago
```

## Setting Up Vercel Environment Variables

Vercel needs the same credentials to run migrations during deployment.

### Step 1: Navigate to Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project (`italian-flashcards`)
3. Click **Settings**
4. Click **Environment Variables** in the left sidebar

### Step 2: Add Variables for Preview Environment

Add the same 7 variables with **test database** credentials:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `SUPABASE_DB_HOST` | `db.slhyzoupwluxgasvapoc.supabase.co` | Preview |
| `SUPABASE_DB_PORT` | `5432` | Preview |
| `SUPABASE_DB_DATABASE` | `postgres` | Preview |
| `SUPABASE_DB_USER` | `postgres` | Preview |
| `SUPABASE_DB_PASSWORD` | [test password] | Preview |
| `SUPABASE_DB_SSL` | `true` | Preview |
| `SUPABASE_DB_SSL_REJECT_UNAUTHORIZED` | `false` | Preview |

For each variable:
1. Click **Add New**
2. Enter the **Key** (variable name)
3. Enter the **Value**
4. Select environment: **Preview** (and optionally Development)
5. Click **Save**

### Step 3: Add Variables for Production Environment

Add the same 7 variables with **production database** credentials:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `SUPABASE_DB_HOST` | `db.gjftooyqkmijlvqbkwdr.supabase.co` | Production |
| `SUPABASE_DB_PORT` | `5432` | Production |
| `SUPABASE_DB_DATABASE` | `postgres` | Production |
| `SUPABASE_DB_USER` | `postgres` | Production |
| `SUPABASE_DB_PASSWORD` | [production password] | Production |
| `SUPABASE_DB_SSL` | `true` | Production |
| `SUPABASE_DB_SSL_REJECT_UNAUTHORIZED` | `false` | Production |

### Step 4: Verify Vercel Variables

After setup, you should see all variables listed with their target environments:

```
SUPABASE_DB_HOST                    Preview, Production
SUPABASE_DB_PORT                    Preview, Production
SUPABASE_DB_DATABASE                Preview, Production
SUPABASE_DB_USER                    Preview, Production
SUPABASE_DB_PASSWORD                Preview, Production
SUPABASE_DB_SSL                     Preview, Production
SUPABASE_DB_SSL_REJECT_UNAUTHORIZED Preview, Production
```

## Testing the Setup

### Test GitHub Actions

1. **Create a test commit:**
   ```bash
   git commit --allow-empty -m "test: verify migration credentials"
   git push
   ```

2. **Check GitHub Actions:**
   - Go to **Actions** tab in your repository
   - Watch the `db-migrations.yml` workflow
   - Should complete successfully with migration validation

3. **Expected output:**
   ```
   ✔ Applied V20250928160049__initial_schema.sql
   ✔ Applied V20251031233404__add_language_preference.sql
   ```

### Test Vercel Deployment

1. **Trigger a deployment:**
   - Push to a branch
   - Vercel will automatically create a preview deployment

2. **Check build logs:**
   - Go to Vercel dashboard → Deployments
   - Click on the latest deployment
   - Check the build logs
   - Look for migration runner output

3. **Expected output:**
   ```
   Running database migrations before Vercel build...
   Applying migration V20250928160049__initial_schema.sql
   Applying migration V20251031233404__add_language_preference.sql
   ✔ Migrations completed successfully
   ```

### Test Locally (Optional)

1. **Add credentials to `.env.local`:**
   ```bash
   # Add to .env.local (test database only!)
   SUPABASE_DB_HOST=db.slhyzoupwluxgasvapoc.supabase.co
   SUPABASE_DB_PORT=5432
   SUPABASE_DB_DATABASE=postgres
   SUPABASE_DB_USER=postgres
   SUPABASE_DB_PASSWORD=your_test_password_here
   SUPABASE_DB_SSL=true
   SUPABASE_DB_SSL_REJECT_UNAUTHORIZED=false
   ```

2. **Run migration check:**
   ```bash
   npm run migrate -- --check
   ```

3. **Expected output:**
   ```
   Checking migration V20250928160049__initial_schema.sql
   Checking migration V20251031233404__add_language_preference.sql
   No new migrations to validate.
   ```

## Security Best Practices

### ✅ Do's

- ✅ Store credentials in **GitHub Secrets** only
- ✅ Store credentials in **Vercel Environment Variables** only
- ✅ Use **test database** for CI/CD and preview deployments
- ✅ Use **production database** only for production deployments
- ✅ Rotate passwords regularly
- ✅ Use strong, unique passwords for each database

### ❌ Don'ts

- ❌ Never commit credentials to git
- ❌ Never put credentials in `.env` files tracked by git
- ❌ Never expose credentials in logs or error messages
- ❌ Never use production database for testing
- ❌ Never share credentials in chat, email, or documentation
- ❌ Never commit `.env.local` with real credentials

## Troubleshooting

### "Missing required environment variables"

**Error in GitHub Actions or Vercel:**
```
Missing required environment variables: SUPABASE_DB_PASSWORD
```

**Solution:**
- Verify all 7 secrets are added to GitHub/Vercel
- Check for typos in variable names
- Ensure variable values don't have extra spaces

### "Authentication failed for user postgres"

**Error:**
```
password authentication failed for user "postgres"
```

**Solution:**
- Verify the password is correct
- Copy password directly from Supabase dashboard
- Check for hidden characters or spaces
- Reset database password if needed

### "Connection timeout" or "ECONNREFUSED"

**Error:**
```
Error connecting to database: ECONNREFUSED
```

**Solution:**
- Verify `SUPABASE_DB_HOST` format: `db.<project-ref>.supabase.co`
- Don't include `https://` or `postgresql://` prefix
- Check that `SUPABASE_DB_PORT` is `5432`
- Ensure Supabase project is not paused
- Verify firewall allows outbound connections on port 5432

### GitHub Actions passes but Vercel fails

**Issue:** Migrations work in CI but fail in Vercel deployment

**Solution:**
- Check Vercel environment variables are set correctly
- Ensure variables are assigned to correct environment (Preview/Production)
- Verify Vercel has access to the database
- Check Vercel build logs for specific error messages

## Quick Setup Checklist

Use this checklist to ensure everything is configured:

### GitHub Secrets
- [ ] `SUPABASE_DB_HOST` added
- [ ] `SUPABASE_DB_PORT` added
- [ ] `SUPABASE_DB_DATABASE` added
- [ ] `SUPABASE_DB_USER` added
- [ ] `SUPABASE_DB_PASSWORD` added
- [ ] `SUPABASE_DB_SSL` added
- [ ] `SUPABASE_DB_SSL_REJECT_UNAUTHORIZED` added
- [ ] All secrets use test database credentials

### Vercel Environment Variables (Preview)
- [ ] `SUPABASE_DB_HOST` added
- [ ] `SUPABASE_DB_PORT` added
- [ ] `SUPABASE_DB_DATABASE` added
- [ ] `SUPABASE_DB_USER` added
- [ ] `SUPABASE_DB_PASSWORD` added
- [ ] `SUPABASE_DB_SSL` added
- [ ] `SUPABASE_DB_SSL_REJECT_UNAUTHORIZED` added
- [ ] All variables use test database credentials
- [ ] All variables assigned to "Preview" environment

### Vercel Environment Variables (Production)
- [ ] `SUPABASE_DB_HOST` added
- [ ] `SUPABASE_DB_PORT` added
- [ ] `SUPABASE_DB_DATABASE` added
- [ ] `SUPABASE_DB_USER` added
- [ ] `SUPABASE_DB_PASSWORD` added
- [ ] `SUPABASE_DB_SSL` added
- [ ] `SUPABASE_DB_SSL_REJECT_UNAUTHORIZED` added
- [ ] All variables use production database credentials
- [ ] All variables assigned to "Production" environment

### Testing
- [ ] GitHub Actions workflow passes
- [ ] Vercel preview deployment succeeds
- [ ] Migration logs show successful execution
- [ ] No errors in deployment logs

## Need Help?

- **Documentation:** See [DB_Versioning_Plan.md](DB_Versioning_Plan.md) for migration workflow
- **GitHub Issues:** Report problems at the repository issues page
- **Supabase Support:** Contact Supabase if database access issues persist

---

**Last Updated:** 2025-11-05
**Related Docs:** [DB_Versioning_Plan.md](DB_Versioning_Plan.md), [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
