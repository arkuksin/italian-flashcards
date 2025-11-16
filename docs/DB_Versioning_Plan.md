# Database Versioning Plan

This document describes how the team should manage Postgres schema changes using the migration tooling that lives in this repository.

## Overview

The migration system uses:
- **Timestamped SQL files** in `db/migrations/` with pattern `V<timestamp>__<description>.sql`
- **Automatic tracking** via the `schema_version` table
- **SHA-256 checksums** to detect unauthorized modifications
- **Transaction wrapping** for automatic rollback on failure
- **CI/CD integration** with GitHub Actions and Vercel

## Prerequisites

1. **Environment Variables** - Ensure the Supabase connection variables are set in `.env.local`:
   ```bash
   SUPABASE_DB_HOST=db.slhyzoupwluxgasvapoc.supabase.co
   SUPABASE_DB_PORT=5432
   SUPABASE_DB_DATABASE=postgres
   SUPABASE_DB_USER=postgres
   SUPABASE_DB_PASSWORD=your_password_here
   SUPABASE_DB_SSL=true
   SUPABASE_DB_SSL_REJECT_UNAUTHORIZED=false
   ```

   **Optional SSL variables:**
   - `SUPABASE_DB_SSL_CA_CERT` - CA certificate content
   - `SUPABASE_DB_SSL_CA_CERT_PATH` - Path to CA certificate file

   **Need help setting up credentials?** See [MIGRATION_CREDENTIALS_SETUP.md](MIGRATION_CREDENTIALS_SETUP.md) for a complete guide on configuring GitHub Secrets and Vercel environment variables.

2. **Dependencies** - Run `npm install` to ensure migration CLI tools are available

3. **Database Access** - Verify you can connect to the target database

## Connection Pooler Considerations

### Understanding Supabase Connection Options

Supabase offers two ways to connect to your PostgreSQL database:

1. **Direct Connection** - `db.<project-ref>.supabase.co:5432`
   - Direct TCP connection to PostgreSQL
   - Full session support
   - Suitable for long-running operations

2. **Connection Pooler** - `<region>.pooler.supabase.com:6543`
   - PgBouncer connection pooling
   - Two modes: **Transaction** and **Session**
   - Reduces connection overhead

### Transaction Mode vs Session Mode

**Transaction Mode** (Default for Supabase pooler):
- Each transaction gets a dedicated connection from the pool
- Connection is released after transaction completes
- ✅ **Safe for migrations** when transactions are properly wrapped
- Supports all DDL operations (CREATE, ALTER, DROP)
- Current project setup uses this mode

**Session Mode**:
- Connection persists for the entire client session
- Mimics direct connection behavior
- May cause issues with PgBouncer in some scenarios

### Migration Runner and Pooler Compatibility

The migration runner is **fully compatible with transaction mode poolers** because:

1. Each migration is wrapped in a `BEGIN...COMMIT` transaction (see `scripts/run-migrations.ts:211-225`)
2. Connection is held for the entire migration execution
3. Rollback occurs automatically on failure
4. `schema_version` tracking is part of the same transaction

**Example from the codebase:**
```typescript
// scripts/run-migrations.ts
await client.query('BEGIN');
try {
  await client.query(sql);  // Migration SQL
  await client.query(trackingSQL);  // Insert into schema_version
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
}
```

### When to Use Direct Connection vs Pooler

**Use Connection Pooler (Transaction Mode):** ✅ Recommended
- CI/CD environments (GitHub Actions, Vercel)
- Standard migrations with DDL changes
- When you need better connection management
- Current project configuration

**Use Direct Connection:**
- Very long-running migrations (>5 minutes)
- Complex administrative operations
- Troubleshooting connection pooler issues
- When PgBouncer transaction mode isn't available

### Current Project Configuration

The project is configured to use the **connection pooler in transaction mode**:

```bash
# .env.local
SUPABASE_DB_HOST=aws-1-eu-central-1.pooler.supabase.com
SUPABASE_DB_PORT=6543
```

This configuration is safe because:
- Bootstrap script wraps operations in transactions (commit ac1c6bb)
- Migration runner has transaction support built-in
- Connection pooler reduces overhead in CI/CD environments

### Troubleshooting Pooler Issues

If you encounter issues with the connection pooler:

1. **Check transaction mode is enabled:**
   - Supabase Dashboard → Database → Connection Pooling
   - Verify "Transaction mode" is selected

2. **Test with direct connection:**
   ```bash
   # Temporarily use direct connection for debugging
   SUPABASE_DB_HOST=db.slhyzoupwluxgasvapoc.supabase.co
   SUPABASE_DB_PORT=5432
   ```

3. **Common pooler error messages:**
   - `"prepared statement already exists"` - Use direct connection or ensure proper cleanup
   - `"server conn crashed?"` - Migration may have timed out, check logs
   - `"no more connections allowed"` - Connection pool exhausted, retry or increase pool size

## How Migration Tracking Works

### The `schema_version` Table

The migration runner automatically creates a tracking table:

```sql
CREATE TABLE IF NOT EXISTS public.schema_version (
  version TEXT PRIMARY KEY,              -- e.g., "V20250928160049"
  description TEXT NOT NULL,             -- e.g., "initial schema"
  checksum TEXT NOT NULL,                -- SHA-256 hash of the SQL file
  executed_at TIMESTAMPTZ NOT NULL,      -- When the migration was applied
  execution_time_ms INTEGER NOT NULL,    -- How long it took to execute
  filename TEXT NOT NULL                 -- e.g., "V20250928160049__initial_schema.sql"
);
```

**How it works:**
1. Before running migrations, the system queries `schema_version` to see what's already applied
2. It compares the checksums of pending migrations against tracked ones
3. Only new migrations (not in the table) are executed
4. Each migration runs in a transaction and records metadata upon success
5. If a checksum mismatch is detected, the migration is rejected (prevents tampering)

## Creating a Migration

### Step 1: Generate the Migration File

Use the helper script to create a timestamped SQL file:

```bash
npm run create:migration "add flashcard progress indexes"
```

This creates: `db/migrations/V20251105123045__add_flashcard_progress_indexes.sql`

### Step 2: Write Idempotent SQL

Edit the generated file and write your migration. The runner wraps every migration in a transaction, so **omit `BEGIN`/`COMMIT`** statements.

**Example migration - Adding a new column:**

```sql
-- Migration: Add difficulty_rating column to words table
-- Author: Dev Team
-- Date: 2025-11-05
-- Description: Adds a difficulty rating (1-5) to help users identify challenging words

-- Add the column with a default value for existing rows
ALTER TABLE public.words
ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER DEFAULT 3
CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5);

-- Add a comment for documentation
COMMENT ON COLUMN public.words.difficulty_rating IS
'User-perceived difficulty rating from 1 (easy) to 5 (very difficult)';

-- Create an index for filtering by difficulty
CREATE INDEX IF NOT EXISTS idx_words_difficulty
ON public.words(difficulty_rating);
```

**Example migration - Adding RLS policy:**

```sql
-- Migration: Add RLS policy for user_progress table
-- Description: Ensures users can only access their own progress data

-- Enable RLS on the table
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;

-- Create the policy
CREATE POLICY "Users can view own progress"
ON public.user_progress
FOR SELECT
USING (auth.uid() = user_id);

-- Add update policy
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;

CREATE POLICY "Users can update own progress"
ON public.user_progress
FOR UPDATE
USING (auth.uid() = user_id);
```

### Step 3: Add Comments and Documentation

Include comments describing:
- The intent of the change
- Why this change is needed
- Any manual follow-up steps
- References to related PRs or issues

### Step 4: Commit with Application Code

Commit the migration file alongside the application code that depends on it:

```bash
git add db/migrations/V20251105123045__add_flashcard_progress_indexes.sql
git add src/components/FlashCard.tsx
git commit -m "feat: add difficulty ratings to flashcards"
```

## Running migrations locally

- Migrations run automatically before `npm run dev` (via the `predev` script) and before `npm start`.
- To run migrations manually, execute:

  ```bash
  npm run migrate
  ```

- To verify that pending migrations are valid without applying them, use:

  ```bash
  npm run migrate -- --check
  ```

## Validating in CI

The GitHub Actions workflow `.github/workflows/db-migrations.yml` runs `npm run migrate -- --check` using Supabase credentials stored in repository secrets.

**Required GitHub Secrets:**
- `SUPABASE_DB_HOST`
- `SUPABASE_DB_PORT`
- `SUPABASE_DB_DATABASE`
- `SUPABASE_DB_USER`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_DB_SSL`
- `SUPABASE_DB_SSL_REJECT_UNAUTHORIZED`

The CI validation ensures:
- All migration files follow the naming convention
- SQL syntax is valid
- Migrations can be applied without errors
- No checksum mismatches exist

## Vercel Environment Variables

Vercel builds execute `node vercel-build-step.mjs` before `npm run build`, which runs migrations using deployment environment variables.

### Setting Up Vercel Environment Variables

1. **Navigate to Vercel Dashboard:**
   - Go to your project → Settings → Environment Variables

2. **Add Database Connection Variables:**

   | Variable Name | Value | Environments |
   |--------------|-------|--------------|
   | `SUPABASE_DB_HOST` | `aws-0-eu-central-1.pooler.supabase.com` (or your region) | Production, Preview |
   | `SUPABASE_DB_PORT` | `6543` | Production, Preview |
   | `SUPABASE_DB_DATABASE` | `postgres` | Production, Preview |
   | `SUPABASE_DB_USER` | `postgres.<project-ref>` | Production, Preview |
   | `SUPABASE_DB_PASSWORD` | Your DB password | Production, Preview |
   | `SUPABASE_DB_SSL` | `true` | Production, Preview |
   | `SUPABASE_DB_SSL_REJECT_UNAUTHORIZED` | `false` | Production, Preview |
   | `NODE_OPTIONS` | `--dns-result-order=ipv4first` | Production, Preview |

3. **Get your database credentials:**
   - Go to Supabase Dashboard → Project Settings → Database
   - Under "Connection Pooling", copy the transaction mode pooler URL (port 6543)
   - **Important:** Use the pooler hostname format and project-qualified username (`postgres.<project-ref>`)
   - See [Connection Pooler Considerations](#connection-pooler-considerations) for details

4. **Important Notes:**
   - Preview deployments should connect to a test/staging database
   - Production deployments connect to the production database
   - Never commit these credentials to git
   - Test the connection after configuration

### Vercel Build Process

The build process follows this sequence:

```
1. Vercel checkout code
2. Install dependencies (npm install)
3. Run vercel-build-step.mjs
   ├─ Load environment variables
   ├─ Run npm run migrate
   └─ Apply pending migrations
4. Run npm run build
5. Deploy application
```

If migrations fail, **the build is aborted** and deployment is prevented.

## Reverting a failed migration

1. If a migration fails locally, the transaction rolls back automatically—fix the SQL and rerun the CLI.
2. If the failure happens in a shared environment (CI, Vercel preview, or production), follow the guidance in `docs/db-migration-rollbacks.md` to restore from backups or craft corrective migrations.
3. Never edit a previously committed migration; instead, create a follow-up file that reverts or adjusts the change.

## Best Practices

- **Keep migrations small and focused** - Easier to review, test, and rollback
- **Coordinate with feature work** - Migrations should accompany the PRs that depend on them
- **Write idempotent SQL** - Use `IF NOT EXISTS`, `IF EXISTS`, and `OR REPLACE` clauses
- **Test against test database first** - Never test migrations directly on production
- **Document irreversible operations** - Add comments in SQL and update rollback guide
- **Run locally before pushing** - Ensure your local environment matches Supabase state
- **Never edit committed migrations** - Create new corrective migrations instead
- **Use meaningful descriptions** - Migration names should clearly indicate what they do
- **Add indexes carefully** - Use `CONCURRENTLY` for large tables to avoid locking
- **Consider data volume** - Test migrations with realistic data sizes

## Testing Migrations

### Test Against Test Database

Always test migrations against the test database before applying to production:

```bash
# 1. Ensure .env.local points to test database
# Test DB: slhyzoupwluxgasvapoc.supabase.co

# 2. Run migration check
npm run migrate -- --check

# 3. Apply migrations
npm run migrate

# 4. Verify the changes
# - Check database schema in Supabase Dashboard
# - Run application locally (npm run dev)
# - Verify application works as expected
```

### Testing Checklist

Before merging a migration PR:

- [ ] Migration file follows naming convention `V<timestamp>__<description>.sql`
- [ ] SQL is idempotent (can be run multiple times safely)
- [ ] Comments explain the purpose and any special considerations
- [ ] Tested locally against test database
- [ ] Application code works with the new schema
- [ ] CI validation passes (GitHub Actions)
- [ ] No checksum mismatches
- [ ] Rollback procedure documented (if needed)

## Migration Testing Strategy

### Testing Workflow

Follow this workflow when creating and testing migrations:

#### 1. Development Phase

**Before writing SQL:**
- Understand the current schema state
- Design the migration approach
- Consider rollback strategy
- Document assumptions

**Writing the migration:**
```bash
# Create migration file
npm run create:migration "add user preferences table"

# Write idempotent SQL
# Add clear comments
# Include rollback notes
```

#### 2. Local Testing

**Test on local database:**
```bash
# Step 1: Lint for common issues
npm run migrate:lint

# Step 2: Dry-run validation
npm run migrate -- --check --verbose

# Step 3: Backup current state (optional)
# pg_dump $DATABASE_URL > backup_before_migration.sql

# Step 4: Apply migration
npm run migrate

# Step 5: Test application functionality
npm run dev
# Manually test affected features

# Step 6: Verify schema changes
# psql $DATABASE_URL -c "\d table_name"

# Step 7: Test rollback (if applicable)
# Create and apply rollback migration
```

#### 3. Unit Testing

**Run automated migration tests:**
```bash
# The project includes unit tests for migrations
# Located in: scripts/__tests__/run-migrations.test.ts

# Run migration unit tests
npm test -- scripts/__tests__/run-migrations.test.ts

# Tests validate:
# - Migration file naming
# - Checksum generation and validation
# - Transaction rollback on failure
# - Migration ordering
# - Duplicate version detection
```

#### 4. Integration Testing

**Test with application E2E tests:**
```bash
# Run E2E tests against test database with new schema
npm run test:e2e

# Common test scenarios:
# - User authentication flows
# - Data creation and retrieval
# - Feature-specific functionality
# - Permission and RLS policies
```

#### 5. CI/CD Validation

**Automated checks in GitHub Actions:**
- Migration validation runs on every PR
- Linting checks for common issues
- Dry-run ensures migrations can apply
- Tests run against test database

**What CI validates:**
```yaml
# .github/workflows/db-migrations.yml
- Naming convention compliance
- SQL syntax validity
- Idempotency (migrations can be checked multiple times)
- No checksum conflicts
- Clean application of pending migrations
```

#### 6. Staging Deployment

**Test in staging environment:**
```bash
# Deploy to Vercel preview
git push origin feature/add-preferences-table

# Vercel automatically:
# 1. Runs migrations against staging database
# 2. Builds application
# 3. Deploys preview

# Manual verification:
# - Visit preview URL
# - Test affected features
# - Check database schema in Supabase dashboard
# - Monitor for errors in logs
```

#### 7. Production Deployment

**Final validation before production:**
- [ ] All tests pass in staging
- [ ] Features work as expected
- [ ] Performance is acceptable
- [ ] Rollback plan documented
- [ ] Team notified of deployment

```bash
# Merge to main triggers production deployment
git checkout main
git merge feature/add-preferences-table
git push origin main

# Monitor deployment:
# - Watch GitHub Actions workflow
# - Check Vercel deployment logs
# - Monitor Supabase database performance
# - Test critical user flows
```

### Testing Best Practices

#### Data-Dependent Tests

For migrations that transform data:

```sql
-- Add test data verification
DO $$
DECLARE
    record_count INT;
    invalid_count INT;
BEGIN
    -- Count total records
    SELECT COUNT(*) INTO record_count FROM users;

    -- Count records that don't meet expectations
    SELECT COUNT(*) INTO invalid_count
    FROM users
    WHERE email IS NULL OR email = '';

    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % users with invalid emails', invalid_count;
    END IF;

    RAISE NOTICE 'Migration validated: % users processed, 0 invalid', record_count;
END $$;
```

#### Performance Testing

For large table migrations:

```bash
# 1. Test with production-like data volume
# Import production data to staging

# 2. Measure migration time
time npm run migrate

# 3. Monitor resource usage
# Check CPU, memory, and IOPS in Supabase dashboard

# 4. Test under load
# Run migration while simulating application traffic
```

#### Rollback Testing

Practice rollback procedures:

```bash
# 1. Apply migration
npm run migrate

# 2. Create rollback migration
npm run migrate:create-revert V20250115120000

# 3. Write rollback SQL

# 4. Test rollback on test database
npm run migrate  # Apply rollback

# 5. Verify state matches pre-migration

# 6. Re-apply original migration
npm run migrate  # Should work idempotently
```

### Testing Tools Reference

**Available commands:**
```bash
# Linting and validation
npm run migrate:lint              # Check for common issues
npm run migrate -- --check        # Dry-run validation
npm run migrate -- --check --verbose  # Show SQL content

# Execution
npm run migrate                   # Apply pending migrations
npm run migrate -- --dir path/to/migrations  # Custom directory

# Testing helpers
npm run test:create-user          # Create test user
npm run test:cleanup-users        # Clean test data

# Rollback helpers
npm run migrate:create-revert V20250115120000  # Generate rollback
```

**Test databases:**
```bash
# Test database (safe for experiments)
SUPABASE_DB_HOST=aws-1-eu-central-1.pooler.supabase.com
SUPABASE_PROJECT_REF=slhyzoupwluxgasvapoc

# Production database (never test here!)
SUPABASE_PROJECT_REF=gjftooyqkmijlvqbkwdr
```

### When Tests Fail

**Migration validation fails:**
1. Review error message carefully
2. Check migration SQL for syntax errors
3. Verify idempotency (IF EXISTS clauses)
4. Run linting: `npm run migrate:lint`
5. Test locally with verbose output

**Application tests fail after migration:**
1. Check application code uses new schema
2. Verify RLS policies grant necessary access
3. Check indexes support required queries
4. Review error logs for specific issues

**Performance degradation:**
1. Check for missing indexes
2. Verify queries are optimized
3. Consider breaking into smaller migrations
4. Use EXPLAIN ANALYZE to identify slow queries

## Troubleshooting

### Common Issues and Solutions

#### 1. "Missing required environment variables"

**Error:**
```
Missing required environment variables: SUPABASE_DB_PASSWORD
```

**Solution:**
- Check `.env.local` exists and contains all required variables
- Verify variable names are correct (no typos)
- Check that `.env.local` is in the project root or `supabase/` directory
- For Vercel: Verify environment variables are set in project settings

#### 2. "Checksum mismatch"

**Error:**
```
Checksum mismatch for V20251105123045__add_indexes.sql.
Expected abc123... but found def456...
```

**Solution:**
- **Never edit a migration after it's been applied**
- If you need to fix it, create a new corrective migration
- If the file was corrupted, restore it from git and create a new migration for additional changes

#### 3. "Migration file with unexpected name"

**Warning:**
```
Ignoring migration file with unexpected name: 20251105_add_indexes.sql
```

**Solution:**
- Migration files must follow pattern: `V<timestamp>__<description>.sql`
- Use `npm run create:migration` to generate properly named files
- Rename manually if needed: `V20251105123045__add_indexes.sql`

#### 4. "ECONNREFUSED" or "Connection timeout"

**Error:**
```
Error connecting to database: ECONNREFUSED
```

**Solution:**
- Verify `SUPABASE_DB_HOST` is correct (format: `db.<project-ref>.supabase.co`)
- Check `SUPABASE_DB_PORT` is set to `5432`
- Ensure SSL is enabled: `SUPABASE_DB_SSL=true`
- Verify firewall/network allows outbound connections on port 5432
- Check Supabase project is not paused

#### 5. "Permission denied" or "Authentication failed"

**Error:**
```
password authentication failed for user "postgres"
```

**Solution:**
- Verify `SUPABASE_DB_PASSWORD` is correct
- Get the password from Supabase Dashboard → Settings → Database
- Ensure you're using the database password, not the project API key
- Check that the postgres user has necessary permissions

#### 6. Migration hangs or takes too long

**Issue:** Migration appears stuck during execution

**Solution:**
- Check for table locks - another connection might be holding a lock
- For index creation on large tables, use `CONCURRENTLY`:
  ```sql
  CREATE INDEX CONCURRENTLY idx_name ON table_name(column);
  ```
- Check Supabase logs for slow queries
- Consider breaking the migration into smaller steps

#### 7. "Duplicate migration version"

**Error:**
```
Duplicate migration version detected: V20251105123045
```

**Solution:**
- Two migration files have the same timestamp
- Delete one and regenerate with `npm run create:migration`
- Timestamps are generated to the second, so wait before creating a new one

#### 8. Vercel build fails with migration error

**Issue:** Vercel deployment fails during migration step

**Solution:**
- Check Vercel build logs for specific error message
- Verify all environment variables are set in Vercel project settings
- Ensure the database is accessible from Vercel (not IP-restricted)
- Test the migration locally first
- Check if the database has pending migrations that conflict

#### 9. "Too many connections" error

**Error:**
```
Error: too many connections for role "postgres"
```

**Solution:**
- Supabase free tier has connection limits (typically 60 connections)
- Check for connection leaks in application code
- Use connection pooler instead of direct connection
- Close connections properly after migration runs
- Consider upgrading Supabase plan for more connections
- Check for stuck/idle connections in Supabase dashboard

#### 10. Migration slow performance / timeout

**Issue:** Migration takes minutes to complete or times out

**Solution:**
- **For large table operations:**
  - Add indexes after data is loaded, not before
  - Use batching for UPDATE/INSERT operations (process 1000 rows at a time)
  - Consider using temporary tables for complex transformations

- **For index creation:**
  ```sql
  -- Use CONCURRENTLY to avoid locking
  CREATE INDEX CONCURRENTLY idx_name ON table_name(column);
  ```

- **For data migrations:**
  ```sql
  -- Batch updates with LIMIT
  DO $$
  DECLARE
    batch_size INT := 1000;
    rows_affected INT;
  BEGIN
    LOOP
      UPDATE table_name
      SET column = new_value
      WHERE id IN (
        SELECT id FROM table_name
        WHERE column IS NULL
        LIMIT batch_size
      );

      GET DIAGNOSTICS rows_affected = ROW_COUNT;
      EXIT WHEN rows_affected = 0;

      COMMIT; -- In pl/pgsql block
      RAISE NOTICE 'Processed % rows', rows_affected;
    END LOOP;
  END $$;
  ```

- **Increase timeout for long migrations:**
  - Vercel: Build timeout is 15 minutes by default
  - Local: No timeout, but should complete in reasonable time
  - Consider splitting into multiple smaller migrations

#### 11. Deadlock detected

**Error:**
```
ERROR: deadlock detected
DETAIL: Process 12345 waits for ShareLock on transaction 67890
```

**Solution:**
- Multiple transactions trying to lock same resources
- Ensure migrations run serially, not in parallel
- Avoid mixing DDL (ALTER TABLE) with DML (INSERT/UPDATE) in same transaction
- Order operations consistently: schema changes first, then data
- If unavoidable, implement retry logic for deadlock-prone operations

#### 12. Connection pooler transaction mode errors

**Error:**
```
ERROR: prepared statement "..." already exists
ERROR: server conn crashed?
```

**Solution:**
- These indicate issues with connection pooler in transaction mode
- **Temporary workaround:** Switch to direct connection:
  ```bash
  SUPABASE_DB_HOST=db.slhyzoupwluxgasvapoc.supabase.co
  SUPABASE_DB_PORT=5432
  ```
- Ensure migrations are wrapped in transactions (already done by runner)
- Avoid prepared statements in migration SQL
- See [Connection Pooler Considerations](#connection-pooler-considerations) for details

#### 13. Vercel build timeout during migrations

**Issue:** Vercel build fails after 15 minutes due to long-running migration

**Solution:**
- **Split large migrations:** Break into multiple smaller migrations
- **Optimize slow operations:**
  - Create indexes CONCURRENTLY
  - Batch large data transformations
  - Remove unnecessary operations
- **Run manually first:** For very large migrations:
  1. Apply migration manually to production database
  2. Commit migration file to git
  3. Bootstrap tracking: `npm run bootstrap:migrations`
  4. Deploy application (migration already applied, will be skipped)

#### 14. Migration works locally but fails in CI/CD

**Issue:** Migration passes locally but fails in GitHub Actions or Vercel

**Solution:**
- **Environment mismatch:**
  - Verify CI/CD is using same database as local (test vs production)
  - Check environment variables are correctly set in GitHub Secrets/Vercel
  - Ensure database schema state is identical

- **Network/connectivity:**
  - Verify CI/CD can reach Supabase (no IP restrictions)
  - Check SSL configuration matches
  - Test connection with verbose logging

- **Timing/concurrency:**
  - CI may run migrations in different order than expected
  - Ensure migrations are independent and idempotent
  - Check for race conditions with parallel deployments

#### 15. Cannot connect with connection pooler port 6543

**Error:**
```
ECONNREFUSED to xxx.pooler.supabase.com:6543
```

**Solution:**
- Connection pooler may not be enabled for your Supabase project
- Check Supabase Dashboard → Database → Connection Pooling
- Enable connection pooling if not already enabled
- Alternatively, use direct connection on port 5432:
  ```bash
  SUPABASE_DB_HOST=db.<project-ref>.supabase.co
  SUPABASE_DB_PORT=5432
  ```

## Bootstrap Existing Migrations

If you have migrations that were applied manually and need to be tracked by the system:

```bash
# Run the bootstrap script to populate schema_version table
npm run bootstrap:migrations
```

This will:
- Read all migration files from `db/migrations/`
- Calculate checksums
- Insert tracking records into `schema_version`
- Skip migrations that are already tracked

**When to use:**
- Migrating from manual schema management to automated migrations
- After moving migration files between directories
- When schema_version table was accidentally dropped
