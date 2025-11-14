#!/usr/bin/env node
/**
 * Diagnostic script to check review_history table status
 * This helps identify why Analytics page shows no data
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('   Need: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkReviewHistory() {
  console.log('🔍 Checking review_history table...\n')

  try {
    // Check if table exists by trying to query it
    const { data, error, count } = await supabase
      .from('review_history')
      .select('*', { count: 'exact', head: false })
      .limit(10)

    if (error) {
      console.error('❌ Error querying review_history table:')
      console.error(`   ${error.message}`)

      if (error.message.includes('does not exist') || error.message.includes('not found')) {
        console.error('\n💡 The review_history table does not exist!')
        console.error('   Solution: Run database migrations:')
        console.error('   npm run migrate')
      }

      return
    }

    console.log(`✅ review_history table exists`)
    console.log(`📊 Total records: ${count || 0}`)

    if (count === 0) {
      console.log('\n⚠️  No review history found!')
      console.log('   This is why Analytics shows no data.')
      console.log('\n💡 To see data in Analytics:')
      console.log('   1. Practice some flashcards on the Dashboard')
      console.log('   2. Answer questions (both correct and incorrect)')
      console.log('   3. Wait a few seconds for data to sync')
      console.log('   4. Refresh the Analytics page')
    } else {
      console.log(`\n📝 Sample records (showing up to 10):`)
      data?.forEach((record, index) => {
        console.log(`\n   Record ${index + 1}:`)
        console.log(`   - Word ID: ${record.word_id}`)
        console.log(`   - Correct: ${record.correct ? '✅' : '❌'}`)
        console.log(`   - Date: ${new Date(record.review_date).toLocaleString()}`)
        console.log(`   - Previous Level: ${record.previous_level} → New Level: ${record.new_level}`)
        if (record.difficulty_rating) {
          const ratings = ['', 'Again', 'Hard', 'Good', 'Easy']
          console.log(`   - Difficulty: ${ratings[record.difficulty_rating]}`)
        }
        if (record.response_time_ms) {
          console.log(`   - Response Time: ${record.response_time_ms}ms`)
        }
      })
    }

    // Check user_progress table too
    const { count: progressCount } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })

    console.log(`\n📈 user_progress records: ${progressCount || 0}`)

    if (progressCount && progressCount > 0 && count === 0) {
      console.log('\n⚠️  Found user_progress but no review_history!')
      console.log('   This suggests:')
      console.log('   - Progress was recorded before Phase 3 implementation')
      console.log('   - OR review_history logging is not working properly')
      console.log('\n💡 Solution: Practice a few more words to generate new review_history records')
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

async function checkMigrationStatus() {
  console.log('\n\n🔍 Checking migration status...\n')

  try {
    const { data, error } = await supabase
      .from('migration_history')
      .select('*')
      .order('applied_at', { ascending: false })
      .limit(5)

    if (error) {
      console.log('⚠️  Cannot check migration_history (table may not exist)')
      console.log('   This is OK if you\'re using a different migration system')
      return
    }

    console.log('📋 Recent migrations:')
    data?.forEach(migration => {
      console.log(`   ✅ ${migration.version} - ${migration.description}`)
      console.log(`      Applied: ${new Date(migration.applied_at).toLocaleString()}`)
    })

    // Check if Phase 3 migration is applied
    const phase3Migration = data?.find(m =>
      m.description?.includes('phase3') ||
      m.description?.includes('review_history')
    )

    if (!phase3Migration) {
      console.log('\n⚠️  Phase 3 migration (review_history) not found!')
      console.log('   Run: npm run migrate')
    }

  } catch (err) {
    console.log('ℹ️  Could not check migration history (this is optional)')
  }
}

// Run checks
checkReviewHistory()
  .then(() => checkMigrationStatus())
  .then(() => {
    console.log('\n✅ Diagnostic complete!\n')
  })
  .catch(err => {
    console.error('\n❌ Diagnostic failed:', err)
    process.exit(1)
  })
