import { supabase } from '../lib/supabase'
import { DifficultyRating, ReviewHistory } from '../types'

/**
 * Service for managing review history
 * Phase 3: Advanced Spaced Repetition
 */
export class ReviewHistoryService {
  private static instance: ReviewHistoryService

  private constructor() {}

  static getInstance(): ReviewHistoryService {
    if (!ReviewHistoryService.instance) {
      ReviewHistoryService.instance = new ReviewHistoryService()
    }
    return ReviewHistoryService.instance
  }

  /**
   * Log a review attempt to the database
   */
  async logReview(params: {
    userId: string
    wordId: number
    correct: boolean
    responseTimeMs?: number
    difficultyRating?: DifficultyRating
    previousLevel: number
    newLevel: number
  }): Promise<ReviewHistory | null> {
    try {
      const { data, error } = await supabase
        .from('review_history')
        .insert({
          user_id: params.userId,
          word_id: params.wordId,
          correct: params.correct,
          response_time_ms: params.responseTimeMs,
          difficulty_rating: params.difficultyRating,
          previous_level: params.previousLevel,
          new_level: params.newLevel,
          review_date: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('Error logging review:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to log review:', error)
      return null
    }
  }

  /**
   * Get review history for a specific word and user
   */
  async getWordReviewHistory(
    userId: string,
    wordId: number,
    limit: number = 10
  ): Promise<ReviewHistory[]> {
    try {
      const { data, error } = await supabase
        .from('review_history')
        .select('*')
        .eq('user_id', userId)
        .eq('word_id', wordId)
        .order('review_date', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching word review history:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch word review history:', error)
      return []
    }
  }

  /**
   * Get all review history for a user
   */
  async getUserReviewHistory(
    userId: string,
    limit: number = 100
  ): Promise<ReviewHistory[]> {
    try {
      const { data, error } = await supabase
        .from('review_history')
        .select('*')
        .eq('user_id', userId)
        .order('review_date', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching user review history:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch user review history:', error)
      return []
    }
  }

  /**
   * Get review statistics for a word
   */
  async getWordReviewStats(userId: string, wordId: number): Promise<{
    totalReviews: number
    correctCount: number
    averageResponseTime?: number
    averageDifficulty?: number
    lastReviewDate?: string
  }> {
    try {
      const reviews = await this.getWordReviewHistory(userId, wordId, 100)

      const totalReviews = reviews.length
      const correctCount = reviews.filter(r => r.correct).length

      const responseTimes = reviews
        .filter(r => r.response_time_ms !== null && r.response_time_ms !== undefined)
        .map(r => r.response_time_ms!)

      const difficulties = reviews
        .filter(r => r.difficulty_rating !== null && r.difficulty_rating !== undefined)
        .map(r => r.difficulty_rating!)

      return {
        totalReviews,
        correctCount,
        averageResponseTime:
          responseTimes.length > 0
            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
            : undefined,
        averageDifficulty:
          difficulties.length > 0
            ? Math.round((difficulties.reduce((a, b) => a + b, 0) / difficulties.length) * 10) / 10
            : undefined,
        lastReviewDate: reviews[0]?.review_date,
      }
    } catch (error) {
      console.error('Failed to calculate word review stats:', error)
      return {
        totalReviews: 0,
        correctCount: 0,
      }
    }
  }

  /**
   * Get recent reviews for analytics
   */
  async getRecentReviews(
    userId: string,
    days: number = 7
  ): Promise<ReviewHistory[]> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      const { data, error } = await supabase
        .from('review_history')
        .select('*')
        .eq('user_id', userId)
        .gte('review_date', cutoffDate.toISOString())
        .order('review_date', { ascending: false })

      if (error) {
        console.error('Error fetching recent reviews:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch recent reviews:', error)
      return []
    }
  }
}

// Export singleton instance
export const reviewHistoryService = ReviewHistoryService.getInstance()
