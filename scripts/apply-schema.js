import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

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

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applySchemaDirect() {
  console.log('🚀 Applying database schema via SQL commands...\n')

  // Schema commands to execute in order
  const schemaCommands = [
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
      name: 'Create RLS Policies for Words',
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
      name: 'Create RLS Policies for User Progress',
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
      name: 'Create RLS Policies for Learning Sessions',
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
      name: 'Create RLS Policies for User Preferences',
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

  console.log('📋 Database Schema Application')
  console.log('===============================\n')
  console.log('⚠️  Due to Supabase API limitations, please execute the following in the Supabase SQL Editor:\n')
  console.log(`🔗 https://app.supabase.com/project/gjftooyqkmijlvqbkwdr/editor\n`)
  console.log('Copy and paste the following SQL:\n')
  console.log('-- ========================================')
  console.log('-- Italian Flashcards Database Schema')
  console.log('-- ========================================\n')

  schemaCommands.forEach((command, index) => {
    console.log(`-- ${index + 1}. ${command.name}`)
    console.log(command.sql.trim())
    console.log('')
  })

  console.log('-- ========================================')
  console.log('-- End of Schema')
  console.log('-- ========================================\n')

  console.log('📝 Instructions:')
  console.log('1. Copy the entire SQL above')
  console.log('2. Go to the Supabase SQL Editor')
  console.log('3. Paste and run the SQL')
  console.log('4. After execution, run: node scripts/migrate-words.js')
  console.log('5. Finally run: node scripts/verify-supabase.js\n')
}

async function main() {
  await applySchemaDirect()
}

main().catch(console.error)