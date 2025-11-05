# Database Migration Guide: Add Language Preference

## Migration Details

**File:** `supabase/migrations/20251031233404_add_language_preference.sql`
**Date:** 2025-10-31
**Purpose:** Add `language_preference` column to store user language choice

## Migration SQL

```sql
-- Add language preference to user_preferences table
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en'
CHECK (language_preference IN ('en', 'ru', 'it', 'de'));

-- Add comment to document the column
COMMENT ON COLUMN user_preferences.language_preference IS 'User preferred language for UI (en=English, ru=Russian, it=Italian, de=German)';

-- Create index for faster language preference lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_language
ON user_preferences(language_preference);
```

## How to Apply

### Method 1: Supabase Dashboard (Recommended)

#### Test Database (slhyzoupwluxgasvapoc)

1. Go to: https://supabase.com/dashboard/project/slhyzoupwluxgasvapoc
2. Navigate to: **SQL Editor**
3. Click: **New Query**
4. Copy and paste the migration SQL above
5. Click: **Run** (or press Cmd/Ctrl + Enter)
6. Verify success message

####Production Database (gjftooyqkmijlvqbkwdr)

1. Go to: https://supabase.com/dashboard/project/gjftooyqkmijlvqbkwdr
2. Navigate to: **SQL Editor**
3. Click: **New Query**
4. Copy and paste the migration SQL above
5. Click: **Run** (or press Cmd/Ctrl + Enter)
6. Verify success message

### Method 2: Supabase CLI

If you have Supabase CLI installed:

```bash
# Push migration to linked project
supabase db push

# Or apply specific migration
supabase migration up
```

### Method 3: Using psql (if installed)

```bash
# Test Database
PGPASSWORD="your-test-db-password" psql \\
  -h db.slhyzoupwluxgasvapoc.supabase.co \\
  -U postgres \\
  -d postgres \\
  -p 5432 \\
  -f supabase/migrations/20251031233404_add_language_preference.sql

# Production Database
PGPASSWORD="your-prod-db-password" psql \\
  -h db.gjftooyqkmijlvqbkwdr.supabase.co \\
  -U postgres \\
  -d postgres \\
  -p 5432 \\
  -f supabase/migrations/20251031233404_add_language_preference.sql
```

## Verification

After applying the migration, verify it worked:

```sql
-- Check if column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_preferences'
AND column_name = 'language_preference';

-- Check index exists
SELECT indexname
FROM pg_indexes
WHERE tablename = 'user_preferences'
AND indexname = 'idx_user_preferences_language';
```

Expected results:
- Column: `language_preference` with type `text` and default `'en'`
- Index: `idx_user_preferences_language`

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove index
DROP INDEX IF EXISTS idx_user_preferences_language;

-- Remove column
ALTER TABLE user_preferences
DROP COLUMN IF EXISTS language_preference;
```

## Impact

- **Breaking Changes:** None (column is optional with default)
- **Downtime:** None
- **Data Loss:** None
- **Performance:** Minimal (index creation is fast for small tables)

## Next Steps

After applying the migration:

1. ✅ TypeScript types already updated
2. ⏳ Integrate language persistence in i18n system
3. ⏳ Update AuthContext to load/save language preference
4. ⏳ Test language switching with database persistence
