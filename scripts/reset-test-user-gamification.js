#!/usr/bin/env node

/**
 * Reset Gamification Data for Test User
 *
 * This script resets the gamification data (XP, levels, achievements, etc.)
 * for the test user to ensure clean test isolation.
 *
 * Usage:
 *   node scripts/reset-test-user-gamification.js
 *   TEST_USER_EMAIL=custom@test.com node scripts/reset-test-user-gamification.js
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test-e2e@example.com'

// Use test database by default
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://slhyzoupwluxgasvapoc.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetGamificationData() {
  console.log('🔄 Reset Test User Gamification Data\n')
  console.log(`📧 Target user: ${TEST_USER_EMAIL}`)
  console.log(`🗄️  Database: ${SUPABASE_URL}\n`)

  try {
    // Get user by email
    console.log('👤 Finding user...')
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`)
    }

    const user = users.find(u => u.email === TEST_USER_EMAIL)

    if (!user) {
      console.log(`⚠️  User ${TEST_USER_EMAIL} not found`)
      console.log('💡 Run `npm run test:create-user` to create the test user first')
      process.exit(0)
    }

    console.log(`✅ Found user: ${user.id}\n`)

    // Reset daily_goals
    console.log('🎯 Resetting daily goals...')
    const { error: goalsError } = await supabase
      .from('daily_goals')
      .upsert({
        user_id: user.id,
        target_words_per_day: 20,
        current_streak: 0,
        longest_streak: 0,
        total_xp: 0,
        level: 1,
        last_practice_date: null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (goalsError) {
      throw new Error(`Failed to reset daily goals: ${goalsError.message}`)
    }
    console.log('✅ Daily goals reset')

    // Delete all achievements
    console.log('🏆 Clearing achievements...')
    const { error: achievementsError } = await supabase
      .from('achievements')
      .delete()
      .eq('user_id', user.id)

    if (achievementsError) {
      throw new Error(`Failed to clear achievements: ${achievementsError.message}`)
    }
    console.log('✅ Achievements cleared')

    // Reset user_progress (learning statistics)
    console.log('📊 Resetting user progress...')
    const { error: progressError } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', user.id)

    if (progressError && progressError.code !== 'PGRST116') {
      throw new Error(`Failed to reset user progress: ${progressError.message}`)
    }
    console.log('✅ User progress reset')

    // Reset review_history
    console.log('📝 Clearing review history...')
    const { error: reviewError } = await supabase
      .from('review_history')
      .delete()
      .eq('user_id', user.id)

    if (reviewError && reviewError.code !== 'PGRST116') {
      throw new Error(`Failed to clear review history: ${reviewError.message}`)
    }
    console.log('✅ Review history cleared')

    console.log('\n✨ Gamification data reset complete!')
    console.log('📊 User stats:')
    console.log('   - Level: 1')
    console.log('   - XP: 0')
    console.log('   - Streak: 0')
    console.log('   - Achievements: 0')
    console.log('   - Progress: Clean slate')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

resetGamificationData()
