import { createClient } from '@supabase/supabase-js';

// Migration SQL
const migrationSQL = `
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en'
CHECK (language_preference IN ('en', 'ru', 'it', 'de'));

COMMENT ON COLUMN user_preferences.language_preference IS 'User preferred language for UI (en=English, ru=Russian, it=Italian, de=German)';

CREATE INDEX IF NOT EXISTS idx_user_preferences_language
ON user_preferences(language_preference);
`;

async function applyMigration(url, serviceRoleKey, dbName) {
  console.log(`\n🔄 Applying migration to ${dbName} database...`);

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  });

  try {
    // We'll use a direct query approach since we have service role key
    const { data, error } = await supabase.from('user_preferences').select('id').limit(1);

    if (error && !error.message.includes('does not exist')) {
      console.error(`❌ Connection error to ${dbName}:`, error);
      return false;
    }

    console.log(`✅ Connected to ${dbName} database`);
    console.log(`ℹ️  Migration SQL needs to be run via Supabase Dashboard SQL Editor`);
    console.log(`   The column will be added when you execute the migration file.`);

    return true;
  } catch (err) {
    console.error(`❌ Exception with ${dbName}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Database Migration Tool\n');
  console.log('📝 Migration: Add language_preference column to user_preferences\n');

  // Test Database
  const testUrl = 'https://slhyzoupwluxgasvapoc.supabase.co';
  const testKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsaHl6b3Vwd2x1eGdhc3ZhcG9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTAwMDY5OCwiZXhwIjoyMDc0NTc2Njk4fQ.sHXPnNygm8rNozI-7p4CBxIpWMk49IpqJyLam2F7lLU';

  // Production Database
  const prodUrl = 'https://gjftooyqkmijlvqbkwdr.supabase.co';
  const prodKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRvb3lxa21pamx2cWJrd2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2Nzc5OSwiZXhwIjoyMDcyNzQzNzk5fQ.AfeqWUIkeK0O4Wqet-VR3SV0OplsnpemJRG2KRSgZVM';

  const testResult = await applyMigration(testUrl, testKey, 'TEST');
  const prodResult = await applyMigration(prodUrl, prodKey, 'PRODUCTION');

  console.log('\n' + '='.repeat(60));
  console.log('📋 Migration SQL to execute:');
  console.log('='.repeat(60));
  console.log(migrationSQL);
  console.log('='.repeat(60));

  console.log('\n📊 Connection Test Summary:');
  console.log(`   Test DB: ${testResult ? '✅ Connected' : '❌ Failed'}`);
  console.log(`   Production DB: ${prodResult ? '✅ Connected' : '❌ Failed'}`);

  console.log('\n💡 Next Steps:');
  console.log('   1. Copy the migration SQL above');
  console.log('   2. Go to Supabase Dashboard → SQL Editor');
  console.log('   3. Paste and run the SQL for both databases');
  console.log('   Or use: supabase db push (if CLI is configured)\n');
}

main();
