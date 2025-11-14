/**
 * E2E Test Helper: Reset Gamification Data
 *
 * This helper resets the gamification data for the authenticated test user
 * to ensure clean test isolation and prevent data accumulation between test runs.
 *
 * Usage in test files:
 *   import { resetGamificationData } from './helpers/reset-gamification'
 *
 *   test.beforeAll(async () => {
 *     await resetGamificationData()
 *   })
 */

import { createClient } from '@supabase/supabase-js'

// These values should come from environment variables
// In CI/CD and test environments, these are automatically set
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test-e2e@example.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required')
}

/**
 * Reset gamification data for the test user
 * This ensures each test suite starts with a clean slate
 */
export async function resetGamificationData(): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  try {
    // Sign in as test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    })

    if (authError || !authData.user) {
      console.warn('⚠️  Could not authenticate test user for gamification reset')
      console.warn('   Tests will run with existing data')
      return
    }

    const userId = authData.user.id

    // Reset daily_goals
    await supabase
      .from('daily_goals')
      .upsert({
        user_id: userId,
        target_words_per_day: 20,
        current_streak: 0,
        longest_streak: 0,
        total_xp: 0,
        level: 1,
        last_practice_date: null,
      }, {
        onConflict: 'user_id'
      })

    // Delete all achievements
    await supabase
      .from('achievements')
      .delete()
      .eq('user_id', userId)

    // Delete user progress
    await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', userId)

    // Delete review history
    await supabase
      .from('review_history')
      .delete()
      .eq('user_id', userId)

    // Sign out
    await supabase.auth.signOut()

    console.log('✨ Gamification data reset complete')
  } catch (error) {
    console.warn('⚠️  Failed to reset gamification data:', error)
    console.warn('   Tests will run with existing data')
  }
}

/**
 * Get current gamification stats for debugging
 */
export async function getGamificationStats() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  try {
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    })

    if (!authData.user) return null

    const { data: goals } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()

    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', authData.user.id)

    const { count: progressCount } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authData.user.id)

    const { count: reviewCount } = await supabase
      .from('review_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authData.user.id)

    await supabase.auth.signOut()

    return {
      goals,
      achievementsCount: achievements?.length || 0,
      progressCount: progressCount || 0,
      reviewCount: reviewCount || 0,
    }
  } catch (error) {
    console.warn('Failed to get gamification stats:', error)
    return null
  }
}
