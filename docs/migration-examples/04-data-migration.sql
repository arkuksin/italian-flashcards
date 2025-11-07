-- Migration: Normalize user email addresses to lowercase
-- Author: Dev Team
-- Date: 2025-01-15
-- Description: Converts all email addresses to lowercase for consistent lookups
--
-- ROLLBACK STRATEGY: IRREVERSIBLE - Original casing will be lost
-- Prevention: Add backup column first (shown below)
--
-- PERFORMANCE: Batched to handle large tables without timeout
-- ESTIMATED TIME: ~1 second per 10,000 rows

-- Step 1: Add backup column for safety
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email_backup TEXT;

-- Step 2: Backup original email values
UPDATE public.users
SET email_backup = email
WHERE email_backup IS NULL;

-- Step 3: Normalize emails in batches to avoid timeout
DO $$
DECLARE
    batch_size INT := 1000;
    rows_affected INT;
    total_processed INT := 0;
BEGIN
    LOOP
        -- Update batch of rows
        UPDATE public.users
        SET email = LOWER(email)
        WHERE id IN (
            SELECT id
            FROM public.users
            WHERE email != LOWER(email)
            LIMIT batch_size
        );

        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        EXIT WHEN rows_affected = 0;

        total_processed := total_processed + rows_affected;
        RAISE NOTICE 'Processed % rows (total: %)', rows_affected, total_processed;

        -- Optional: Add small delay to reduce database load
        -- PERFORM pg_sleep(0.1);
    END LOOP;

    RAISE NOTICE 'Data migration complete. Total rows processed: %', total_processed;
END $$;

-- Step 4: Add index on normalized email (after data migration)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower
ON public.users(LOWER(email));

-- Step 5: Add comment for documentation
COMMENT ON COLUMN public.users.email IS
'Email address (always lowercase for consistent lookups)';

-- TODO: After verifying data is correct, remove backup column in future migration:
-- ALTER TABLE public.users DROP COLUMN IF EXISTS email_backup;
