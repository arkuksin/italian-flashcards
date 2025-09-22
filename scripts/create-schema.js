import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables - use .env for service role key
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase service credentials')
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env')
  process.exit(1)
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQL(sql, description) {
  console.log(`\n📝 ${description}...`)

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single()

    if (error) {
      // Try direct execution as fallback
      const { data: directData, error: directError } = await supabase
        .from('_sql')
        .insert({ query: sql })
        .select()

      if (directError) {
        console.error(`❌ Failed: ${directError.message}`)
        return false
      }
    }

    console.log(`✅ ${description} - Success`)
    return true
  } catch (err) {
    console.error(`❌ Error: ${err.message}`)
    return false
  }
}

async function createSchema() {
  console.log('🚀 Starting database schema creation...\n')

  // Step 1: Enable UUID extension
  const enableUUID = `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

  // Step 2: Create words table
  const createWordsTable = `
    CREATE TABLE IF NOT EXISTS words (
      id SERIAL PRIMARY KEY,
      russian TEXT NOT NULL,
      italian TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `

  // Step 3: Create user_progress table
  const createUserProgressTable = `
    CREATE TABLE IF NOT EXISTS user_progress (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
      correct_count INTEGER DEFAULT 0,
      wrong_count INTEGER DEFAULT 0,
      last_practiced TIMESTAMPTZ DEFAULT NOW(),
      mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, word_id)
    );
  `

  // Step 4: Create learning_sessions table
  const createLearningSessionsTable = `
    CREATE TABLE IF NOT EXISTS learning_sessions (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      ended_at TIMESTAMPTZ,
      words_studied INTEGER DEFAULT 0,
      correct_answers INTEGER DEFAULT 0,
      wrong_answers INTEGER DEFAULT 0,
      learning_direction TEXT CHECK (learning_direction IN ('ru-it', 'it-ru', 'mixed')),
      session_duration_seconds INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `

  // Step 5: Create user_preferences table
  const createUserPreferencesTable = `
    CREATE TABLE IF NOT EXISTS user_preferences (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
      dark_mode BOOLEAN DEFAULT false,
      default_learning_direction TEXT DEFAULT 'ru-it' CHECK (default_learning_direction IN ('ru-it', 'it-ru')),
      shuffle_mode BOOLEAN DEFAULT false,
      daily_goal INTEGER DEFAULT 20,
      notification_enabled BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `

  // Step 6: Create update trigger function
  const createUpdateFunction = `
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `

  // Execute schema creation using service role key
  console.log('📦 Creating database schema using service role access...')

  // Since we can't use RPC directly, let's use a different approach
  // We'll create the tables using the Supabase dashboard SQL editor
  console.log('\n⚠️  Direct SQL execution via API requires additional setup.')
  console.log('📋 I will now guide you through executing the schema in the Supabase dashboard.\n')

  return false // Indicate manual execution needed
}

async function verifySchema() {
  console.log('\n🔍 Verifying database schema...\n')

  try {
    // Check if words table exists
    const { data: wordsCheck, error: wordsError } = await supabase
      .from('words')
      .select('count', { count: 'exact', head: true })

    if (!wordsError || wordsError.code === 'PGRST116') {
      console.log('✅ Words table exists')
    } else if (wordsError.code === '42P01') {
      console.log('❌ Words table does not exist')
      return false
    }

    // Check if user_progress table exists
    const { data: progressCheck, error: progressError } = await supabase
      .from('user_progress')
      .select('count', { count: 'exact', head: true })

    if (!progressError || progressError.code === 'PGRST116') {
      console.log('✅ User_progress table exists')
    } else if (progressError.code === '42P01') {
      console.log('❌ User_progress table does not exist')
      return false
    }

    // Check if learning_sessions table exists
    const { data: sessionsCheck, error: sessionsError } = await supabase
      .from('learning_sessions')
      .select('count', { count: 'exact', head: true })

    if (!sessionsError || sessionsError.code === 'PGRST116') {
      console.log('✅ Learning_sessions table exists')
    } else if (sessionsError.code === '42P01') {
      console.log('❌ Learning_sessions table does not exist')
      return false
    }

    // Check if user_preferences table exists
    const { data: prefsCheck, error: prefsError } = await supabase
      .from('user_preferences')
      .select('count', { count: 'exact', head: true })

    if (!prefsError || prefsError.code === 'PGRST116') {
      console.log('✅ User_preferences table exists')
    } else if (prefsError.code === '42P01') {
      console.log('❌ User_preferences table does not exist')
      return false
    }

    console.log('\n✅ All tables verified successfully!')
    return true

  } catch (err) {
    console.error('❌ Verification failed:', err)
    return false
  }
}

async function main() {
  // First, check if schema already exists
  const schemaExists = await verifySchema()

  if (schemaExists) {
    console.log('\n✅ Database schema already exists and is verified!')
    console.log('You can proceed with data migration.')
    return
  }

  // Schema doesn't exist, provide instructions
  console.log('\n📝 Database schema needs to be created.')
  console.log('\n========================================')
  console.log('MANUAL SETUP REQUIRED')
  console.log('========================================\n')
  console.log('Please follow these steps:\n')
  console.log('1. Open your Supabase Dashboard:')
  console.log(`   https://app.supabase.com/project/gjftooyqkmijlvqbkwdr/editor\n`)
  console.log('2. Click "New Query" in the SQL Editor\n')
  console.log('3. Copy and paste the contents of:')
  console.log('   supabase/schema.sql\n')
  console.log('4. Click "Run" to execute the schema\n')
  console.log('5. After execution, run this script again to verify:\n')
  console.log('   node scripts/create-schema.js\n')
  console.log('========================================\n')
}

main().catch(console.error)