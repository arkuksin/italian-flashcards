import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN
const supabaseUrl = process.env.SUPABASE_URL

if (!supabaseAccessToken || !supabaseUrl) {
  console.error('❌ Missing Supabase credentials')
  console.error('Please ensure SUPABASE_ACCESS_TOKEN and SUPABASE_URL are set in .env')
  process.exit(1)
}

// Extract project ID from URL
const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!projectId) {
  console.error('❌ Could not extract project ID from URL:', supabaseUrl)
  process.exit(1)
}

async function executeSQLCommand(sql, description) {
  console.log(`\n📝 ${description}...`)

  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log(`❌ ${description} - Failed: ${response.status} ${errorText}`)
      return false
    }

    const result = await response.json()
    console.log(`✅ ${description} - Success`)

    // Log any useful result info (but not too verbose)
    if (Array.isArray(result) && result.length > 0 && Object.keys(result[0]).length <= 3) {
      console.log(`   Result: ${JSON.stringify(result)}`)
    }

    return true
  } catch (err) {
    console.log(`❌ ${description} - Exception: ${err.message}`)
    return false
  }
}

async function createDatabaseSchema() {
  console.log('🚀 Automatically Creating Database Schema\n')
  console.log(`🎯 Project: ${projectId}`)
  console.log(`🔗 URL: ${supabaseUrl}\n`)

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
      name: 'Create User Progress Table',
      sql: `
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
    },
    {
      name: 'Create Learning Sessions Table',
      sql: `
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
    },
    {
      name: 'Create User Preferences Table',
      sql: `
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
    },
    {
      name: 'Create Update Function',
      sql: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    },
    {
      name: 'Create Update Triggers',
      sql: `
        DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
        CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `
    },
    {
      name: 'Create User Preferences Trigger',
      sql: `
        DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
        CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `
    },
    {
      name: 'Enable Row Level Security',
      sql: `
        ALTER TABLE words ENABLE ROW LEVEL SECURITY;
        ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
        ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
      `
    },
    {
      name: 'Create Words Policies',
      sql: `
        DROP POLICY IF EXISTS "Words are viewable by everyone" ON words;
        CREATE POLICY "Words are viewable by everyone" ON words
          FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Authenticated users can insert words" ON words;
        CREATE POLICY "Authenticated users can insert words" ON words
          FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
      `
    },
    {
      name: 'Create User Progress Policies',
      sql: `
        DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
        CREATE POLICY "Users can view own progress" ON user_progress
          FOR SELECT USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
        CREATE POLICY "Users can insert own progress" ON user_progress
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
        CREATE POLICY "Users can update own progress" ON user_progress
          FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can delete own progress" ON user_progress;
        CREATE POLICY "Users can delete own progress" ON user_progress
          FOR DELETE USING (auth.uid() = user_id);
      `
    },
    {
      name: 'Create Learning Sessions Policies',
      sql: `
        DROP POLICY IF EXISTS "Users can view own sessions" ON learning_sessions;
        CREATE POLICY "Users can view own sessions" ON learning_sessions
          FOR SELECT USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can insert own sessions" ON learning_sessions;
        CREATE POLICY "Users can insert own sessions" ON learning_sessions
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can update own sessions" ON learning_sessions;
        CREATE POLICY "Users can update own sessions" ON learning_sessions
          FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
      `
    },
    {
      name: 'Create User Preferences Policies',
      sql: `
        DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
        CREATE POLICY "Users can view own preferences" ON user_preferences
          FOR SELECT USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
        CREATE POLICY "Users can insert own preferences" ON user_preferences
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
        CREATE POLICY "Users can update own preferences" ON user_preferences
          FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
      `
    },
    {
      name: 'Create Performance Indexes',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_words_category ON words(category);
        CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_progress_word_id ON user_progress(word_id);
        CREATE INDEX IF NOT EXISTS idx_user_progress_mastery ON user_progress(mastery_level);
        CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON learning_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_learning_sessions_started_at ON learning_sessions(started_at DESC);
      `
    }
  ]

  let successCount = 0
  let failureCount = 0

  console.log('📋 Executing Schema Steps:')
  console.log('=' .repeat(50))

  for (let i = 0; i < schemaSteps.length; i++) {
    const step = schemaSteps[i]
    const success = await executeSQLCommand(step.sql, `${i + 1}/${schemaSteps.length} ${step.name}`)

    if (success) {
      successCount++
    } else {
      failureCount++
    }

    // Small delay between operations
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\n' + '=' .repeat(50))
  console.log('📊 SCHEMA CREATION SUMMARY')
  console.log('=' .repeat(50))
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${failureCount}`)
  console.log(`📈 Success Rate: ${Math.round((successCount / schemaSteps.length) * 100)}%`)

  if (failureCount === 0) {
    console.log('\n🎉 DATABASE SCHEMA CREATED SUCCESSFULLY!')
    console.log('\n🚀 Next steps:')
    console.log('   1. Run: node scripts/migrate-words.js')
    console.log('   2. Run: node scripts/verify-supabase.js')
    console.log('   3. Configure authentication in Supabase dashboard')
    return true
  } else {
    console.log('\n⚠️  Schema creation completed with some failures.')
    console.log('Review the errors above and consider manual intervention.')
    return false
  }
}

async function main() {
  try {
    const success = await createDatabaseSchema()
    process.exit(success ? 0 : 1)
  } catch (err) {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  }
}

main()