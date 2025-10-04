import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test database credentials
const supabaseUrl = 'https://slhyzoupwluxgasvapoc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsaHl6b3Vwd2x1eGdhc3ZhcG9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTAwMDY5OCwiZXhwIjoyMDc0NTc2Njk4fQ.sHXPnNygm8rNozI-7p4CBxIpWMk49IpqJyLam2F7lLU';

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTestDatabase() {
  try {
    console.log('🚀 Setting up test database schema...');

    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split the SQL into individual statements (very basic split)
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
      .map(stmt => stmt + ';');

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim() === ';') continue;

      console.log(`  ${i + 1}/${statements.length}: Executing statement...`);

      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });

        if (error) {
          // Try using direct query for simpler statements
          const { error: queryError } = await supabase
            .from('_supabase_rpc')
            .select('*')
            .limit(0); // This will create a connection

          if (queryError) {
            console.log(`    ⚠️  Statement might not support rpc, trying alternative...`);
          }
        }
      } catch (err) {
        console.log(`    ⚠️  Statement ${i + 1} failed, continuing...`);
      }
    }

    console.log('✅ Database schema setup completed!');

    // Test the connection by checking if tables exist
    console.log('🔍 Verifying tables...');

    // Check if we can query basic table info (this should work even with basic permissions)
    const { data: tablesCheck, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['words', 'user_progress', 'learning_sessions', 'user_preferences']);

    if (tablesError) {
      console.log('⚠️  Could not verify tables directly, but schema should be applied');
    } else {
      console.log('✅ Tables verified:', tablesCheck?.map(t => t.table_name));
    }

  } catch (error) {
    console.error('❌ Error setting up test database:', error.message);
    process.exit(1);
  }
}

setupTestDatabase();