import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase service credentials')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQL(sql, description) {
  console.log(`\n📝 ${description}...`)

  try {
    // Try different approaches to execute SQL

    // Method 1: Try using a stored procedure if available
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (!rpcError) {
      console.log(`✅ ${description} - Success via RPC`)
      return true
    }

    // Method 2: Try direct HTTP API call
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql_query: sql })
    })

    if (response.ok) {
      console.log(`✅ ${description} - Success via HTTP`)
      return true
    }

    // Method 3: Try using PostgREST's direct SQL endpoint (if available)
    const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/sql',
        'Accept': 'application/json'
      },
      body: sql
    })

    if (sqlResponse.ok) {
      console.log(`✅ ${description} - Success via SQL endpoint`)
      return true
    }

    console.log(`❌ ${description} - All methods failed`)
    console.log(`   RPC Error: ${rpcError?.message}`)
    console.log(`   HTTP Status: ${response.status}`)
    console.log(`   SQL Status: ${sqlResponse.status}`)

    return false

  } catch (err) {
    console.log(`❌ ${description} - Exception: ${err.message}`)
    return false
  }
}

async function createExecSQLFunction() {
  console.log('🔧 Creating SQL execution function...')

  // First, let's try to create a function that can execute arbitrary SQL
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
      RETURN 'Success';
    EXCEPTION
      WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
    END;
    $$;
  `

  try {
    // Try to create this function using the basic client
    const { error } = await supabase.rpc('sql', { query: createFunctionSQL })

    if (!error) {
      console.log('✅ SQL execution function created')
      return true
    } else {
      console.log('❌ Cannot create SQL function:', error.message)
      return false
    }
  } catch (err) {
    console.log('❌ Exception creating function:', err.message)
    return false
  }
}

async function testDirectExecution() {
  console.log('🚀 Testing Direct SQL Execution Methods\n')

  // Test simple SQL
  const testSQL = 'SELECT 1 as test;'

  const success = await executeSQL(testSQL, 'Testing simple SELECT')

  if (success) {
    console.log('\n✅ Found working SQL execution method!')
    return true
  } else {
    console.log('\n❌ No direct SQL execution method available')
    return false
  }
}

async function executeSchemaSteps() {
  console.log('📋 Executing Database Schema...\n')

  const schemaSteps = [
    {
      name: 'Enable UUID Extension',
      sql: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
    },
    {
      name: 'Create Words Table',
      sql: `
        CREATE TABLE IF NOT EXISTS words (
          id SERIAL PRIMARY KEY,
          russian TEXT NOT NULL,
          italian TEXT NOT NULL,
          category TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    {
      name: 'Enable RLS on Words',
      sql: `ALTER TABLE words ENABLE ROW LEVEL SECURITY;`
    },
    {
      name: 'Create Words Policy',
      sql: `
        CREATE POLICY IF NOT EXISTS "Words are viewable by everyone" ON words
          FOR SELECT USING (true);
      `
    }
  ]

  let successCount = 0

  for (const step of schemaSteps) {
    const success = await executeSQL(step.sql, step.name)
    if (success) successCount++
  }

  console.log(`\n📊 Schema execution result: ${successCount}/${schemaSteps.length} steps successful`)

  return successCount === schemaSteps.length
}

async function main() {
  console.log('🔍 Analyzing Automatic SQL Execution Capabilities\n')

  // Test if we can execute SQL directly
  const canExecute = await testDirectExecution()

  if (canExecute) {
    console.log('\n🎯 Proceeding with automatic schema creation...')
    const schemaSuccess = await executeSchemaSteps()

    if (schemaSuccess) {
      console.log('\n🎉 Schema created successfully!')
      console.log('You can now run: node scripts/migrate-words.js')
    } else {
      console.log('\n⚠️  Partial schema creation. Manual intervention may be needed.')
    }
  } else {
    console.log('\n❌ Direct SQL execution not available through API')
    console.log('\n💡 Reasons why automatic execution might not work:')
    console.log('   1. PostgREST security restrictions on DDL operations')
    console.log('   2. Supabase disables direct SQL execution via REST API')
    console.log('   3. Service role limitations on schema modifications')
    console.log('   4. Missing exec_sql function in the database')
    console.log('\n📝 Manual execution via SQL Editor remains the recommended approach')
  }
}

main().catch(console.error)