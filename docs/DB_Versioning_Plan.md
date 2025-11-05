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
   | `SUPABASE_DB_HOST` | `db.<project-ref>.supabase.co` | Production, Preview |
   | `SUPABASE_DB_PORT` | `5432` | Production, Preview |
   | `SUPABASE_DB_DATABASE` | `postgres` | Production, Preview |
   | `SUPABASE_DB_USER` | `postgres` | Production, Preview |
   | `SUPABASE_DB_PASSWORD` | Your DB password | Production, Preview |
   | `SUPABASE_DB_SSL` | `true` | Production, Preview |
   | `SUPABASE_DB_SSL_REJECT_UNAUTHORIZED` | `false` | Production, Preview |

3. **Get your database credentials:**
   - Go to Supabase Dashboard → Project Settings → Database
   - Copy the connection string details
   - **Use the direct database connection, not the pooler URL**

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
