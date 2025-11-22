import { supabase } from '../lib/supabase'
import type { WordOfTheDay, WotDProgress, WotDHistoryDay } from '../types'

export class WordOfTheDayService {
  private static instance: WordOfTheDayService

  private constructor() {}

  static getInstance(): WordOfTheDayService {
    if (!WordOfTheDayService.instance) {
      WordOfTheDayService.instance = new WordOfTheDayService()
    }
    return WordOfTheDayService.instance
  }

  /**
   * Get today's Word of the Day
   */
  async getTodaysWord(): Promise<WordOfTheDay | null> {
    try {
      const today = new Date().toISOString().split('T')[0]
      return this.getWordForDate(today)
    } catch (error) {
      console.error('Error fetching today\'s word:', error)
      throw error
    }
  }

  /**
   * Get Word of the Day for a specific date
   */
  async getWordForDate(date: string): Promise<WordOfTheDay | null> {
    try {
      const { data, error } = await supabase.rpc('get_word_of_the_day', {
        p_date: date
      })

      if (error) {
        console.error('Error fetching word for date:', error)
        throw error
      }

      return data?.[0] || null
    } catch (error) {
      console.error('Failed to get word for date:', error)
      throw new Error('Failed to load Word of the Day')
    }
  }

  /**
   * Get user's progress for a specific Word of the Day
   */
  async getUserProgress(wotdId: string): Promise<WotDProgress | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('user_wotd_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('wotd_id', wotdId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching user progress:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to get user progress:', error)
      return null
    }
  }

  /**
   * Mark Word of the Day as viewed
   */
  async markAsViewed(wotdId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('user_wotd_progress')
        .upsert({
          user_id: user.id,
          wotd_id: wotdId,
          viewed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,wotd_id'
        })

      if (error) {
        console.error('Error marking as viewed:', error)
        throw error
      }
    } catch (error) {
      console.error('Failed to mark as viewed:', error)
      throw error
    }
  }

  /**
   * Mark Word of the Day as completed (learned)
   */
  async markAsCompleted(wotdId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('user_wotd_progress')
        .upsert({
          user_id: user.id,
          wotd_id: wotdId,
          viewed_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,wotd_id'
        })

      if (error) {
        console.error('Error marking as completed:', error)
        throw error
      }
    } catch (error) {
      console.error('Failed to mark as completed:', error)
      throw error
    }
  }

  /**
   * Get history of last 7 days (whether user completed each day's word)
   */
  async getLast7Days(): Promise<WotDHistoryDay[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Generate last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date.toISOString().split('T')[0]
      }).reverse()

      // Get all WotDs for these days
      const { data: wotds, error: wotdError } = await supabase
        .from('word_of_the_day')
        .select('id, date')
        .in('date', last7Days)

      if (wotdError) {
        console.error('Error fetching WotDs:', wotdError)
        throw wotdError
      }

      if (!wotds || wotds.length === 0) {
        // No words for these days
        return last7Days.map(date => ({ date, completed: false }))
      }

      // Get user's progress for these WotDs
      const wotdIds = wotds.map(w => w.id)
      const { data: progress, error: progressError } = await supabase
        .from('user_wotd_progress')
        .select('wotd_id, completed_at')
        .eq('user_id', user.id)
        .in('wotd_id', wotdIds)

      if (progressError) {
        console.error('Error fetching progress:', progressError)
        throw progressError
      }

      // Map days to completion status
      return last7Days.map(date => {
        const wotd = wotds.find(w => w.date === date)
        if (!wotd) return { date, completed: false }

        const userProgress = progress?.find(p => p.wotd_id === wotd.id)
        return {
          date,
          completed: !!userProgress?.completed_at
        }
      })
    } catch (error) {
      console.error('Failed to get last 7 days:', error)
      return []
    }
  }

  /**
   * Generate next Word of the Day (admin function)
   */
  async generateNextWord(): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_next_word_of_the_day')

      if (error) {
        console.error('Error generating next word:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to generate next word:', error)
      throw new Error('Failed to generate next Word of the Day')
    }
  }
}

// Export singleton instance
export const wordOfTheDayService = WordOfTheDayService.getInstance()
