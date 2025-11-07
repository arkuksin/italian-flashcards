# Database Migration Rollbacks

While the migration runner executes every SQL file inside a transaction, some operations can still have lasting effects (e.g., data deletions). This guide summarizes the manual steps required to recover from failed deployments or accidental schema changes.

## Before you deploy

- Enable automated database backups in Supabase for production projects.
- For high-risk migrations, take a manual snapshot immediately before running the change.
- Communicate the migration plan with the team and schedule deployments during low-traffic windows.

## Responding to a failed migration

1. **Identify the failure**
   - Review the CLI output from CI, Vercel, or local runs to determine which migration failed.
   - Because migrations run inside a transaction, schema changes in the failing file are rolled back automatically.

2. **Assess data impact**
   - If the migration included data updates (`UPDATE`, `DELETE`, `INSERT`), verify whether any statements executed before the failure. Use Supabase's query history to confirm.
   - If data was altered, plan a compensating migration to restore the expected state.

3. **Create a corrective migration**
   - Never modify the failing migration file directly.
   - Generate a new migration using `npm run create:migration` that either fixes the SQL or reverts the previous change.
   - Document why the rollback was necessary in the new file's comments.

4. **Restore from backup if needed**
   - For destructive failures (e.g., accidental table drops), restore the Supabase backup taken before deployment.
   - Coordinate with stakeholders before initiating a restore—backups replace the entire database, so downstream services may experience downtime.

## Rolling back in production

- Pause any background jobs or API traffic that might reapply failing migrations.
- Restore the backup or apply corrective migrations as described above.
- Re-run `npm run migrate` once the database is back to a healthy state to ensure all migrations succeed.

## Common Rollback Patterns

### Pattern 1: Rolling Back a Column Addition

**Original Migration (V20250101120000__add_status_column.sql):**
```sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
```

**Rollback Migration (V20250101130000__remove_status_column.sql):**
```sql
-- Rollback: Remove status column added in V20250101120000
-- Reason: Status logic moved to separate table

ALTER TABLE public.users
DROP COLUMN IF EXISTS status;
```

### Pattern 2: Rolling Back a Table Creation

**Original Migration (V20250101120000__create_analytics_table.sql):**
```sql
CREATE TABLE IF NOT EXISTS public.analytics (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Rollback Migration (V20250101130000__drop_analytics_table.sql):**
```sql
-- Rollback: Remove analytics table created in V20250101120000
-- Reason: Analytics implementation changed to use external service

DROP TABLE IF EXISTS public.analytics CASCADE;
```

### Pattern 3: Rolling Back a Data Transformation

**Original Migration (V20250101120000__normalize_email_addresses.sql):**
```sql
-- Convert all email addresses to lowercase
UPDATE public.users
SET email = LOWER(email)
WHERE email != LOWER(email);
```

**Rollback Strategy:**
This is **irreversible** - original casing is lost. Prevention strategies:
- Add a backup column before transformation
- Export data before migration
- Test on staging first with real data

**Better approach with safety net:**
```sql
-- Add backup column
ALTER TABLE public.users ADD COLUMN email_original TEXT;

-- Backup original values
UPDATE public.users SET email_original = email;

-- Transform
UPDATE public.users SET email = LOWER(email);

-- After verification, remove backup in a later migration
```

### Pattern 4: Rolling Back an Index Creation

**Original Migration (V20250101120000__add_email_index.sql):**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email
ON public.users(email);
```

**Rollback Migration (V20250101130000__remove_email_index.sql):**
```sql
-- Rollback: Remove email index created in V20250101120000
-- Reason: Index causing performance issues on large table

DROP INDEX CONCURRENTLY IF EXISTS public.idx_users_email;
```

### Pattern 5: Rolling Back RLS Policy Changes

**Original Migration (V20250101120000__add_admin_policy.sql):**
```sql
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'admin'
);
```

**Rollback Migration (V20250101130000__revert_admin_policy.sql):**
```sql
-- Rollback: Restore original admin policy
-- Reason: JWT role claim not available yet

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Restore original policy (if it existed)
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users
  )
);
```

## Creating Rollback Migrations

### Using the Helper Script

Create a rollback migration for a specific version:

```bash
npm run migrate:create-revert V20250101120000
```

This generates a new migration file with a template rollback structure:

```sql
-- ROLLBACK for V20250101120000__<description>.sql
-- This migration reverts the changes made in the referenced migration
--
-- INSTRUCTIONS:
-- 1. Review the original migration file
-- 2. Write SQL that reverses each operation
-- 3. Test on staging database first
-- 4. Document why rollback was necessary
--
-- ORIGINAL MIGRATION SUMMARY:
-- [Auto-populated from original migration comments]

-- TODO: Add your rollback SQL here
```

### Manual Rollback Creation

If you prefer manual creation:

```bash
npm run create:migration "revert_<description>"
```

Then add rollback SQL with proper documentation.

## Rollback Decision Tree

```
Failed Migration?
├─ Was transaction rolled back automatically?
│  ├─ YES → Fix SQL and create corrective migration
│  └─ NO (rare) → Assess data damage
│
├─ Did data get corrupted/deleted?
│  ├─ YES → Restore from backup + apply corrective migrations
│  └─ NO → Create forward migration to undo changes
│
└─ Production impacted?
   ├─ HIGH IMPACT → Restore backup immediately
   └─ LOW IMPACT → Schedule corrective migration
```

## Testing Rollback Procedures

### Local Testing Workflow

1. **Create test database snapshot:**
   ```bash
   # Export current state
   pg_dump $DATABASE_URL > backup_before_migration.sql
   ```

2. **Apply migration:**
   ```bash
   npm run migrate
   ```

3. **Test rollback migration:**
   ```bash
   npm run migrate  # Apply rollback
   ```

4. **Verify database state:**
   ```bash
   # Compare schema before and after
   psql $DATABASE_URL -c "\d users"
   ```

5. **Restore if needed:**
   ```bash
   psql $DATABASE_URL < backup_before_migration.sql
   ```

## Additional tips

- **Keep rollback instructions with migrations:** Add comments explaining how to reverse each operation
- **Use feature flags or phased rollouts:** Reduce blast radius of schema changes
- **Test restoring backups regularly:** Ensure team confidence in recovery procedures
- **Document irreversible operations:** Add prominent warnings in migration files
- **Create rollback plans before applying:** Don't wait for failures to plan recovery
- **Use staging environment:** Always test migrations and rollbacks on staging first
- **Monitor after deployment:** Watch for errors, performance issues, or data anomalies
- **Keep communication open:** Alert team before high-risk migrations
