import { createClient } from '@supabase/supabase-js';

const migrationSQL = `
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en'
CHECK (language_preference IN ('en', 'ru', 'it', 'de'));

COMMENT ON COLUMN user_preferences.language_preference IS 'User preferred language for UI (en=English, ru=Russian, it=Italian, de=German)';

CREATE INDEX IF NOT EXISTS idx_user_preferences_language
ON user_preferences(language_preference);
`;

// Create a temporary function that executes the migration
const createMigrationFunction = `
CREATE OR REPLACE FUNCTION apply_language_preference_migration()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add column if not exists
  ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en';

  -- Add check constraint if not exists
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'user_preferences_language_preference_check'
    ) THEN
      ALTER TABLE user_preferences
      ADD CONSTRAINT user_preferences_language_preference_check
      CHECK (language_preference IN ('en', 'ru', 'it', 'de'));
    END IF;
  END $$;

  -- Add comment
  COMMENT ON COLUMN user_preferences.language_preference IS
    'User preferred language for UI (en=English, ru=Russian, it=Italian, de=German)';

  -- Create index if not exists
  CREATE INDEX IF NOT EXISTS idx_user_preferences_language
  ON user_preferences(language_preference);

  RAISE NOTICE 'Migration applied successfully';
END;
$$;
`;

async function applyMigration(url, serviceRoleKey, dbName) {
  console.log(`\n🔄 Applying migration to ${dbName} database...`);

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Step 1: Create the migration function using a simple insert to test connection
    console.log(`   Testing connection...`);

    const { data: testData, error: testError } = await supabase
      .from('user_preferences')
      .select('id')
      .limit(1);

    if (testError && !testError.message.includes('does not exist')) {
      console.error(`   ❌ Connection failed:`, testError.message);
      return false;
    }

    console.log(`   ✅ Connected successfully`);
    console.log(`   ⚠️  Direct SQL execution not supported via REST API`);
    console.log(`   📝 Migration must be applied via Supabase Dashboard`);

    return true;
  } catch (err) {
    console.error(`   ❌ Error:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Database Migration Application Tool\n');
  console.log('=' .repeat(60));

  // Test Database
  const testUrl = 'https://slhyzoupwluxgasvapoc.supabase.co';
  const testKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsaHl6b3Vwd2x1eGdhc3ZhcG9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTAwMDY5OCwiZXhwIjoyMDc0NTc2Njk4fQ.sHXPnNygm8rNozI-7p4CBxIpWMk49IpqJyLam2F7lLU';

  // Production Database
  const prodUrl = 'https://gjftooyqkmijlvqbkwdr.supabase.co';
  const prodKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRvb3lxa21pamx2cWJrd2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2Nzc5OSwiZXhwIjoyMDcyNzQzNzk5fQ.AfeqWUIkeK0O4Wqet-VR3SV0OplsnpemJRG2KRSgZVM';

  const testResult = await applyMigration(testUrl, testKey, 'TEST');
  const prodResult = await applyMigration(prodUrl, prodKey, 'PRODUCTION');

  console.log('\n' + '=' .repeat(60));
  console.log('📋 MIGRATION SQL (Copy and paste into Supabase Dashboard):');
  console.log('=' .repeat(60));
  console.log(migrationSQL);
  console.log('=' .repeat(60));

  console.log('\n📊 Summary:');
  console.log(`   Test DB Connection: ${testResult ? '✅ OK' : '❌ Failed'}`);
  console.log(`   Production DB Connection: ${prodResult ? '✅ OK' : '❌ Failed'}`);

  console.log('\n📖 Instructions:');
  console.log('   1. Test DB:  https://supabase.com/dashboard/project/slhyzoupwluxgasvapoc/sql/new');
  console.log('   2. Prod DB:  https://supabase.com/dashboard/project/gjftooyqkmijlvqbkwdr/sql/new');
  console.log('   3. Paste the SQL above and click "Run"');
  console.log('');
}

main();
