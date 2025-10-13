#!/usr/bin/env node
/**
 * Test database connection and progress tracking tables
 * Run with: node test-db-connection.js
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔌 Testing Supabase Connection\n')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!')
  console.error('   Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

console.log(`✅ Supabase URL: ${supabaseUrl}`)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    // Test 1: Check words table
    console.log('\n📊 Test 1: Reading words table...')
    const { data: words, error: wordsError } = await supabase
      .from('words')
      .select('count')
      .limit(1)

    if (wordsError) throw wordsError
    console.log('   ✅ Words table accessible')

    // Test 2: Check user_progress table structure
    console.log('\n📊 Test 2: Checking user_progress table...')
    const { error: progressError } = await supabase
      .from('user_progress')
      .select('id, user_id, word_id, mastery_level')
      .limit(0)

    if (progressError) throw progressError
    console.log('   ✅ user_progress table exists with correct columns')

    // Test 3: Check learning_sessions table
    console.log('\n📊 Test 3: Checking learning_sessions table...')
    const { error: sessionsError } = await supabase
      .from('learning_sessions')
      .select('id, user_id, started_at, learning_direction')
      .limit(0)

    if (sessionsError) throw sessionsError
    console.log('   ✅ learning_sessions table exists with correct columns')

    console.log('\n🎉 All database tables ready for progress tracking!')
    console.log('\n💡 Nächster Schritt: Starte "npm run dev" und teste die App')

  } catch (error) {
    console.error('\n❌ Database connection error:', error.message)
    console.error('\n📝 Mögliche Lösungen:')
    console.error('   1. Prüfe ob .env.local existiert und korrekt ist')
    console.error('   2. Überprüfe Supabase Dashboard → Table Editor')
    console.error('   3. Führe Migration aus (falls Tabellen fehlen)')
  }
}

testConnection()
