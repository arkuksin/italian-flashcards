-- Migration: Rename column with zero downtime
-- Author: Dev Team
-- Date: 2025-01-15
-- Description: Renames 'old_name' to 'new_name' without breaking running application
--
-- STRATEGY: Multi-step approach
-- - Migration 1: Add new column, sync data (THIS FILE)
-- - Deployment: Update application to use new column
-- - Migration 2: Remove old column (future migration)
--
-- ROLLBACK: Can revert by dropping new_name column
-- This migration is Step 1 of 2

-- Step 1: Add new column (without NOT NULL yet)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS new_name TEXT;

-- Step 2: Copy existing data from old column to new column
UPDATE public.users
SET new_name = old_name
WHERE new_name IS NULL;

-- Step 3: Add trigger to keep columns in sync during transition period
-- This ensures both columns stay consistent while old code still writes to old_name
CREATE OR REPLACE FUNCTION sync_column_rename()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Sync old_name -> new_name
        IF NEW.old_name IS DISTINCT FROM OLD.old_name THEN
            NEW.new_name := NEW.old_name;
        END IF;
        -- Sync new_name -> old_name (for new code)
        IF NEW.new_name IS DISTINCT FROM OLD.new_name THEN
            NEW.old_name := NEW.new_name;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_old_name_new_name ON public.users;

CREATE TRIGGER sync_old_name_new_name
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION sync_column_rename();

-- Step 4: Add index on new column (matching old column's index)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_new_name
ON public.users(new_name);

-- Step 5: Add comment
COMMENT ON COLUMN public.users.new_name IS
'Renamed from old_name - replaces deprecated old_name column';

COMMENT ON COLUMN public.users.old_name IS
'DEPRECATED: Use new_name instead. Will be removed in future migration.';

-- ============================================================
-- DEPLOYMENT STEPS:
-- ============================================================
-- 1. Apply this migration
-- 2. Deploy new application code that reads/writes to new_name
-- 3. Monitor for 24-48 hours
-- 4. Once confident, apply cleanup migration (see below)
--
-- CLEANUP MIGRATION (create this after deployment stabilizes):
-- ```sql
-- -- Drop trigger and function
-- DROP TRIGGER IF EXISTS sync_old_name_new_name ON public.users;
-- DROP FUNCTION IF EXISTS sync_column_rename();
--
-- -- Make new_name NOT NULL if old_name was NOT NULL
-- ALTER TABLE public.users
-- ALTER COLUMN new_name SET NOT NULL;
--
-- -- Remove old column
-- ALTER TABLE public.users
-- DROP COLUMN IF EXISTS old_name;
--
-- -- Drop old index
-- DROP INDEX CONCURRENTLY IF EXISTS idx_users_old_name;
-- ```
