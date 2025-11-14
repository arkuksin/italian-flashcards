import { supabase } from '../lib/supabase'
import { ReviewHistory, WordProgress } from '../types'

/**
 * Phase 4: Statistics and Analytics Service
 *
 * Provides comprehensive analytics about user learning performance:
 * - Learning velocity (words mastered per week)
 * - Retention rate analysis
 * - Category performance comparison
 * - Time-to-mastery metrics
 * - Review heatmap data
 */

export interface LearningVelocityData {
  weekLabel: string
  weekStart: string
  wordsReviewed: number
  wordsMastered: number
  accuracy: number
}

export interface RetentionMetrics {
  overallRetentionRate: number
  retentionByLevel: {
    level: number
    retentionRate: number
    totalReviews: number
  }[]
  recentTrend: 'improving' | 'stable' | 'declining'
}

export interface CategoryPerformance {
  category: string
  totalWords: number
  masteredWords: number
  averageLevel: number
  accuracy: number
  averageResponseTime?: number
}

export interface TimeToMasteryMetrics {
  averageDaysToMastery: number
  fastestMastery: number
  slowestMastery: number
  distributionByLevel: {
    level: number
    averageDays: number
    count: number
  }[]
}

export interface ReviewHeatmapData {
  date: string
  reviewCount: number
  accuracy: number
}

export class AnalyticsService {
  private static instance: AnalyticsService

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  /**
   * Calculate learning velocity - words mastered per week
   */
  async getLearningVelocity(userId: string, weeks: number = 12): Promise<LearningVelocityData[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - weeks * 7)

      const { data: reviews, error } = await supabase
        .from('review_history')
        .select('*')
        .eq('user_id', userId)
        .gte('review_date', startDate.toISOString())
        .order('review_date', { ascending: true })

      if (error) throw error

      // Group reviews by week
      const weeklyData = new Map<string, {
        weekStart: Date
        reviews: ReviewHistory[]
        masteredWords: Set<number>
      }>()

      reviews?.forEach(review => {
        const reviewDate = new Date(review.review_date)
        const weekStart = new Date(reviewDate)
        weekStart.setDate(reviewDate.getDate() - reviewDate.getDay()) // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0]

        if (!weeklyData.has(weekKey)) {
          weeklyData.set(weekKey, {
            weekStart,
            reviews: [],
            masteredWords: new Set(),
          })
        }

        const weekData = weeklyData.get(weekKey)!
        weekData.reviews.push(review)

        // A word is considered "mastered" when it reaches level 5
        if (review.new_level === 5) {
          weekData.masteredWords.add(review.word_id)
        }
      })

      // Convert to array and calculate metrics
      const velocityData: LearningVelocityData[] = Array.from(weeklyData.entries())
        .map(([weekKey, data]) => {
          const correctReviews = data.reviews.filter(r => r.correct).length
          const totalReviews = data.reviews.length

          return {
            weekLabel: this.formatWeekLabel(data.weekStart),
            weekStart: weekKey,
            wordsReviewed: new Set(data.reviews.map(r => r.word_id)).size,
            wordsMastered: data.masteredWords.size,
            accuracy: totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0,
          }
        })
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart))

      return velocityData
    } catch (error) {
      console.error('Error calculating learning velocity:', error)
      return []
    }
  }

  /**
   * Analyze retention rates - how well users maintain mastery
   */
  async getRetentionMetrics(userId: string): Promise<RetentionMetrics> {
    try {
      // Get reviews from the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: reviews, error } = await supabase
        .from('review_history')
        .select('*')
        .eq('user_id', userId)
        .gte('review_date', thirtyDaysAgo.toISOString())
        .order('review_date', { ascending: true })

      if (error) throw error

      if (!reviews || reviews.length === 0) {
        return {
          overallRetentionRate: 0,
          retentionByLevel: [],
          recentTrend: 'stable',
        }
      }

      // Calculate overall retention (correct answers / total reviews)
      const correctReviews = reviews.filter(r => r.correct).length
      const overallRetentionRate = (correctReviews / reviews.length) * 100

      // Calculate retention by previous mastery level
      const reviewsByLevel = new Map<number, { correct: number; total: number }>()

      reviews.forEach(review => {
        const level = review.previous_level
        if (!reviewsByLevel.has(level)) {
          reviewsByLevel.set(level, { correct: 0, total: 0 })
        }
        const levelData = reviewsByLevel.get(level)!
        levelData.total++
        if (review.correct) levelData.correct++
      })

      const retentionByLevel = Array.from(reviewsByLevel.entries())
        .map(([level, data]) => ({
          level,
          retentionRate: (data.correct / data.total) * 100,
          totalReviews: data.total,
        }))
        .sort((a, b) => a.level - b.level)

      // Determine trend by comparing first half vs second half of reviews
      const midPoint = Math.floor(reviews.length / 2)
      const firstHalf = reviews.slice(0, midPoint)
      const secondHalf = reviews.slice(midPoint)

      const firstHalfRate = firstHalf.filter(r => r.correct).length / firstHalf.length
      const secondHalfRate = secondHalf.filter(r => r.correct).length / secondHalf.length

      let recentTrend: 'improving' | 'stable' | 'declining'
      if (secondHalfRate > firstHalfRate + 0.05) {
        recentTrend = 'improving'
      } else if (secondHalfRate < firstHalfRate - 0.05) {
        recentTrend = 'declining'
      } else {
        recentTrend = 'stable'
      }

      return {
        overallRetentionRate,
        retentionByLevel,
        recentTrend,
      }
    } catch (error) {
      console.error('Error calculating retention metrics:', error)
      return {
        overallRetentionRate: 0,
        retentionByLevel: [],
        recentTrend: 'stable',
      }
    }
  }

  /**
   * Compare performance across different word categories
   */
  async getCategoryPerformance(userId: string): Promise<CategoryPerformance[]> {
    try {
      // Get all words with their categories
      const { data: words, error: wordsError } = await supabase
        .from('words')
        .select('id, category')

      if (wordsError) throw wordsError

      // Get user progress for all words
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)

      if (progressError) throw progressError

      // Get review history for response times
      const { data: reviews, error: reviewsError } = await supabase
        .from('review_history')
        .select('word_id, correct, response_time_ms')
        .eq('user_id', userId)

      if (reviewsError) throw reviewsError

      // Build category map
      const categoryMap = new Map<string, number[]>()
      words?.forEach(word => {
        if (!categoryMap.has(word.category)) {
          categoryMap.set(word.category, [])
        }
        categoryMap.get(word.category)!.push(word.id)
      })

      // Build progress map
      const progressMap = new Map<number, WordProgress>()
      progress?.forEach(p => {
        progressMap.set(p.word_id, p)
      })

      // Build review stats map
      const reviewStatsMap = new Map<number, { correct: number; total: number; responseTimes: number[] }>()
      reviews?.forEach(review => {
        if (!reviewStatsMap.has(review.word_id)) {
          reviewStatsMap.set(review.word_id, { correct: 0, total: 0, responseTimes: [] })
        }
        const stats = reviewStatsMap.get(review.word_id)!
        stats.total++
        if (review.correct) stats.correct++
        if (review.response_time_ms) stats.responseTimes.push(review.response_time_ms)
      })

      // Calculate performance by category
      const categoryPerformance: CategoryPerformance[] = Array.from(categoryMap.entries())
        .map(([category, wordIds]) => {
          const categoryProgress = wordIds
            .map(id => progressMap.get(id))
            .filter(p => p !== undefined) as WordProgress[]

          const masteredWords = categoryProgress.filter(p => p.mastery_level === 5).length

          const totalLevel = categoryProgress.reduce((sum, p) => sum + p.mastery_level, 0)
          const averageLevel = categoryProgress.length > 0 ? totalLevel / categoryProgress.length : 0

          // Calculate accuracy from reviews
          const categoryReviews = wordIds
            .map(id => reviewStatsMap.get(id))
            .filter(stats => stats !== undefined) as { correct: number; total: number; responseTimes: number[] }[]

          const totalCorrect = categoryReviews.reduce((sum, stats) => sum + stats.correct, 0)
          const totalReviews = categoryReviews.reduce((sum, stats) => sum + stats.total, 0)
          const accuracy = totalReviews > 0 ? (totalCorrect / totalReviews) * 100 : 0

          // Calculate average response time
          const allResponseTimes = categoryReviews.flatMap(stats => stats.responseTimes)
          const averageResponseTime = allResponseTimes.length > 0
            ? allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length
            : undefined

          return {
            category,
            totalWords: wordIds.length,
            masteredWords,
            averageLevel,
            accuracy,
            averageResponseTime,
          }
        })
        .sort((a, b) => b.averageLevel - a.averageLevel)

      return categoryPerformance
    } catch (error) {
      console.error('Error calculating category performance:', error)
      return []
    }
  }

  /**
   * Calculate time-to-mastery metrics
   */
  async getTimeToMasteryMetrics(userId: string): Promise<TimeToMasteryMetrics> {
    try {
      // Get all reviews ordered by date
      const { data: reviews, error } = await supabase
        .from('review_history')
        .select('*')
        .eq('user_id', userId)
        .order('review_date', { ascending: true })

      if (error) throw error

      if (!reviews || reviews.length === 0) {
        return {
          averageDaysToMastery: 0,
          fastestMastery: 0,
          slowestMastery: 0,
          distributionByLevel: [],
        }
      }

      // Track first and last review date for each word
      const wordTimelines = new Map<number, { firstReview: Date; masteryDate?: Date; levelReaches: Map<number, Date> }>()

      reviews.forEach(review => {
        if (!wordTimelines.has(review.word_id)) {
          wordTimelines.set(review.word_id, {
            firstReview: new Date(review.review_date),
            levelReaches: new Map(),
          })
        }

        const timeline = wordTimelines.get(review.word_id)!

        // Track when each level was reached
        if (!timeline.levelReaches.has(review.new_level)) {
          timeline.levelReaches.set(review.new_level, new Date(review.review_date))
        }

        // Track mastery (level 5)
        if (review.new_level === 5 && !timeline.masteryDate) {
          timeline.masteryDate = new Date(review.review_date)
        }
      })

      // Calculate days to mastery for mastered words
      const masteryTimes: number[] = []
      wordTimelines.forEach(timeline => {
        if (timeline.masteryDate) {
          const days = (timeline.masteryDate.getTime() - timeline.firstReview.getTime()) / (1000 * 60 * 60 * 24)
          masteryTimes.push(days)
        }
      })

      // Calculate distribution by level
      const levelDistribution = new Map<number, number[]>()
      for (let level = 1; level <= 5; level++) {
        levelDistribution.set(level, [])
      }

      wordTimelines.forEach(timeline => {
        timeline.levelReaches.forEach((reachDate, level) => {
          if (level > 0) {
            const days = (reachDate.getTime() - timeline.firstReview.getTime()) / (1000 * 60 * 60 * 24)
            levelDistribution.get(level)?.push(days)
          }
        })
      })

      const distributionByLevel = Array.from(levelDistribution.entries())
        .map(([level, days]) => ({
          level,
          averageDays: days.length > 0 ? days.reduce((a, b) => a + b, 0) / days.length : 0,
          count: days.length,
        }))
        .filter(item => item.count > 0)

      return {
        averageDaysToMastery: masteryTimes.length > 0
          ? masteryTimes.reduce((a, b) => a + b, 0) / masteryTimes.length
          : 0,
        fastestMastery: masteryTimes.length > 0 ? Math.min(...masteryTimes) : 0,
        slowestMastery: masteryTimes.length > 0 ? Math.max(...masteryTimes) : 0,
        distributionByLevel,
      }
    } catch (error) {
      console.error('Error calculating time-to-mastery metrics:', error)
      return {
        averageDaysToMastery: 0,
        fastestMastery: 0,
        slowestMastery: 0,
        distributionByLevel: [],
      }
    }
  }

  /**
   * Get review heatmap data for calendar visualization
   */
  async getReviewHeatmap(userId: string, days: number = 90): Promise<ReviewHeatmapData[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data: reviews, error } = await supabase
        .from('review_history')
        .select('review_date, correct')
        .eq('user_id', userId)
        .gte('review_date', startDate.toISOString())

      if (error) throw error

      // Group by date
      const dailyData = new Map<string, { correct: number; total: number }>()

      reviews?.forEach(review => {
        const date = review.review_date.split('T')[0] // Get date part only
        if (!dailyData.has(date)) {
          dailyData.set(date, { correct: 0, total: 0 })
        }
        const dayData = dailyData.get(date)!
        dayData.total++
        if (review.correct) dayData.correct++
      })

      // Convert to array
      const heatmapData: ReviewHeatmapData[] = Array.from(dailyData.entries())
        .map(([date, data]) => ({
          date,
          reviewCount: data.total,
          accuracy: (data.correct / data.total) * 100,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))

      return heatmapData
    } catch (error) {
      console.error('Error generating review heatmap:', error)
      return []
    }
  }

  /**
   * Helper: Format week label for display
   */
  private formatWeekLabel(weekStart: Date): string {
    const month = weekStart.toLocaleDateString('en-US', { month: 'short' })
    const day = weekStart.getDate()
    return `${month} ${day}`
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance()
