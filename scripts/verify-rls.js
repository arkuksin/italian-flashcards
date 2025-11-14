import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') })
dotenv.config({ path: join(__dirname, '..', '.env.local') }) // Also load anon key

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase service credentials')
  process.exit(1)
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRLSStatus() {
  console.log('🔒 Checking Row Level Security status...\n')

  try {
    // Query to check RLS status for all our tables
    const { data, error } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .in('relname', ['words', 'user_progress', 'learning_sessions', 'user_preferences'])

    if (error) {
      console.error('❌ Error checking RLS status:', error)
      return false
    }

    data.forEach(table => {
      const status = table.relrowsecurity ? '✅ ENABLED' : '❌ DISABLED'
      console.log(`   ${table.relname}: ${status}`)
    })

    const allEnabled = data.every(table => table.relrowsecurity)
    console.log(`\n${allEnabled ? '✅' : '❌'} RLS Status: ${allEnabled ? 'All tables protected' : 'Some tables unprotected'}`)

    return allEnabled
  } catch (err) {
    console.error('❌ Error:', err)
    return false
  }
}

async function checkPolicies() {
  console.log('\n🛡️  Checking RLS policies...\n')

  try {
    // Query policies for our tables
    const { data, error } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, permissive, cmd')
      .in('tablename', ['words', 'user_progress', 'learning_sessions', 'user_preferences'])

    if (error) {
      console.error('❌ Error checking policies:', error)
      return false
    }

    const tables = ['words', 'user_progress', 'learning_sessions', 'user_preferences']

    tables.forEach(tableName => {
      const tablePolicies = data.filter(p => p.tablename === tableName)
      console.log(`📋 ${tableName}:`)

      if (tablePolicies.length === 0) {
        console.log('   ❌ No policies found')
      } else {
        tablePolicies.forEach(policy => {
          console.log(`   ✅ ${policy.policyname} (${policy.cmd})`)
        })
      }
      console.log('')
    })

    return data.length > 0
  } catch (err) {
    console.error('❌ Error:', err)
    return false
  }
}

async function checkIndexes() {
  console.log('⚡ Checking performance indexes...\n')

  try {
    // Query indexes for our tables
    const { data, error } = await supabase
      .from('pg_indexes')
      .select('tablename, indexname, indexdef')
      .in('tablename', ['words', 'user_progress', 'learning_sessions', 'user_preferences'])

    if (error) {
      console.error('❌ Error checking indexes:', error)
      return false
    }

    const tables = ['words', 'user_progress', 'learning_sessions', 'user_preferences']

    tables.forEach(tableName => {
      const tableIndexes = data.filter(i => i.tablename === tableName && !i.indexname.includes('_pkey'))
      console.log(`📊 ${tableName}:`)

      if (tableIndexes.length === 0) {
        console.log('   ⚠️  No custom indexes found')
      } else {
        tableIndexes.forEach(index => {
          console.log(`   ✅ ${index.indexname}`)
        })
      }
      console.log('')
    })

    return true
  } catch (err) {
    console.error('❌ Error:', err)
    return false
  }
}

async function testBasicOperations() {
  console.log('🧪 Testing basic database operations...\n')

  try {
    // Test 1: Read from words table (should work - public read)
    const { data: wordsData, error: wordsError } = await supabase
      .from('words')
      .select('count', { count: 'exact', head: true })

    if (wordsError && wordsError.code !== 'PGRST116') {
      console.log('❌ Words table read test failed:', wordsError.message)
      return false
    } else {
      console.log('✅ Words table read access working')
    }

    // Test 2: Try to read user_progress without auth (should fail with RLS)
    const anonClient = createClient(supabaseUrl, supabaseAnonKey || '')

    const { data: progressData, error: progressError } = await anonClient
      .from('user_progress')
      .select('count', { count: 'exact', head: true })

    if (progressError && progressError.code === 'PGRST301') {
      console.log('✅ User_progress table properly protected by RLS')
    } else if (!progressError) {
      console.log('⚠️  User_progress table accessible without auth (RLS may not be configured)')
    } else {
      console.log('✅ User_progress table access restricted')
    }

    // Test 3: Foreign key constraint check
    const { data: fkData, error: fkError } = await supabase
      .from('information_schema.table_constraints')
      .select('table_name, constraint_name, constraint_type')
      .eq('constraint_type', 'FOREIGN KEY')
      .in('table_name', ['user_progress', 'learning_sessions', 'user_preferences'])

    if (!fkError && fkData.length > 0) {
      console.log('✅ Foreign key constraints verified')
      fkData.forEach(fk => {
        console.log(`   - ${fk.table_name}: ${fk.constraint_name}`)
      })
    }

    return true
  } catch (err) {
    console.error('❌ Error:', err)
    return false
  }
}

async function main() {
  console.log('🚀 Comprehensive Database Verification\n')
  console.log('=======================================\n')

  let allPassed = true

  // Check RLS status
  const rlsStatus = await checkRLSStatus()
  allPassed = allPassed && rlsStatus

  // Check policies
  const policiesExist = await checkPolicies()
  allPassed = allPassed && policiesExist

  // Check indexes
  const indexesExist = await checkIndexes()
  allPassed = allPassed && indexesExist

  // Test operations
  const operationsWork = await testBasicOperations()
  allPassed = allPassed && operationsWork

  console.log('\n=======================================')
  console.log('📊 VERIFICATION SUMMARY')
  console.log('=======================================\n')

  if (allPassed) {
    console.log('✅ All checks passed! Database is properly configured.')
    console.log('\n🎉 Your database is ready for:')
    console.log('   - User authentication and authorization')
    console.log('   - Secure data access with RLS')
    console.log('   - Optimal query performance')
    console.log('   - Data migration')
  } else {
    console.log('⚠️  Some issues found. Please review the output above.')
    console.log('\n📝 Next steps:')
    console.log('   1. If RLS is disabled, run the schema.sql again')
    console.log('   2. If policies are missing, add them via SQL Editor')
    console.log('   3. If indexes are missing, they can be added later')
  }
}

main().catch(console.error)