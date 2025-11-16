import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, TrendingUp, Brain } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { UserProfile } from '../components/auth/UserProfile'
import { LearningVelocityChart } from '../components/LearningVelocityChart'
import { RetentionAnalysis } from '../components/RetentionAnalysis'
import { ReviewHeatmap } from '../components/ReviewHeatmap'
import { Container } from '../components/layout'
import {
  analyticsService,
  LearningVelocityData,
  RetentionMetrics,
  CategoryPerformance,
  TimeToMasteryMetrics,
  ReviewHeatmapData,
} from '../services/analyticsService'

/**
 * Phase 4: Analytics Dashboard Page
 *
 * Comprehensive analytics view showing:
 * - Learning velocity (words mastered per week)
 * - Retention rate analysis
 * - Category performance comparison
 * - Time-to-mastery metrics
 * - Review heatmap (calendar view)
 */
export const Analytics: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [velocityData, setVelocityData] = useState<LearningVelocityData[]>([])
  const [retentionData, setRetentionData] = useState<RetentionMetrics>({
    overallRetentionRate: 0,
    retentionByLevel: [],
    recentTrend: 'stable',
  })
  const [categoryData, setCategoryData] = useState<CategoryPerformance[]>([])
  const [masteryData, setMasteryData] = useState<TimeToMasteryMetrics>({
    averageDaysToMastery: 0,
    fastestMastery: 0,
    slowestMastery: 0,
    distributionByLevel: [],
  })
  const [heatmapData, setHeatmapData] = useState<ReviewHeatmapData[]>([])

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!user) return

      setLoading(true)

      try {
        // Load all analytics data in parallel
        const [velocity, retention, categories, mastery, heatmap] = await Promise.all([
          analyticsService.getLearningVelocity(user.id, 12),
          analyticsService.getRetentionMetrics(user.id),
          analyticsService.getCategoryPerformance(user.id),
          analyticsService.getTimeToMasteryMetrics(user.id),
          analyticsService.getReviewHeatmap(user.id, 90),
        ])

        setVelocityData(velocity)
        setRetentionData(retention)
        setCategoryData(categories)
        setMasteryData(mastery)
        setHeatmapData(heatmap)
      } catch (error) {
        console.error('Error loading analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [user])

  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <Container width="analytics" className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                data-testid="back-to-dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Analytics Dashboard
                </h1>
              </div>
            </div>
            <UserProfile />
          </div>
        </Container>
      </div>

      {/* Main Content */}
      <Container width="analytics" className="py-8">
        <div className="space-y-6">
          {/* Learning Velocity */}
          <div data-testid="learning-velocity-section">
            <LearningVelocityChart data={velocityData} loading={loading} />
          </div>

          {/* Retention Analysis and Review Heatmap */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div data-testid="retention-analysis-section">
              <RetentionAnalysis data={retentionData} loading={loading} />
            </div>
            <div data-testid="review-heatmap-section">
              <ReviewHeatmap data={heatmapData} loading={loading} />
            </div>
          </div>

          {!loading && (
            <>

            {/* Category Performance */}
            {categoryData.length > 0 && (
              <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
                data-testid="category-performance-section"
              >
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Category Performance
                  </h3>
                </div>

                <div className="space-y-4">
                  {categoryData.map(category => (
                    <div
                      key={category.category}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {category.category}
                        </h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {category.masteredWords}/{category.totalWords} mastered
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Avg Level
                          </div>
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {category.averageLevel.toFixed(1)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Accuracy
                          </div>
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {category.accuracy.toFixed(0)}%
                          </div>
                        </div>
                        {category.averageResponseTime && (
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Avg Time
                            </div>
                            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                              {(category.averageResponseTime / 1000).toFixed(1)}s
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${(category.masteredWords / category.totalWords) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time to Mastery Metrics */}
            {masteryData.distributionByLevel.length > 0 && (
              <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
                data-testid="time-to-mastery-section"
              >
                <div className="flex items-center gap-2 mb-6">
                  <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Time to Mastery
                  </h3>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                      Average to Mastery
                    </div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {masteryData.averageDaysToMastery.toFixed(1)} days
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="text-xs text-green-600 dark:text-green-400 mb-1">
                      Fastest Mastery
                    </div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {masteryData.fastestMastery.toFixed(1)} days
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">
                      Slowest Mastery
                    </div>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {masteryData.slowestMastery.toFixed(1)} days
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Average Time by Level
                  </h4>
                  {masteryData.distributionByLevel.map(level => (
                    <div key={level.level} className="flex items-center gap-4">
                      <div className="w-16 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Level {level.level}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                            <div
                              className={`h-6 rounded-full flex items-center justify-end px-2 ${
                                level.level === 1
                                  ? 'bg-red-500'
                                  : level.level === 2
                                  ? 'bg-orange-500'
                                  : level.level === 3
                                  ? 'bg-yellow-500'
                                  : level.level === 4
                                  ? 'bg-blue-500'
                                  : 'bg-purple-500'
                              }`}
                              style={{
                                width: `${Math.min((level.averageDays / masteryData.averageDaysToMastery) * 100, 100)}%`,
                              }}
                            >
                              <span className="text-xs text-white font-medium">
                                {level.averageDays.toFixed(1)}d
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 w-20">
                            ({level.count} words)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Empty State */}
          {!loading &&
            velocityData.length === 0 &&
            retentionData.retentionByLevel.length === 0 &&
            categoryData.length === 0 &&
            heatmapData.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Analytics Data Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start practicing to see detailed analytics about your learning progress!
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Start Practicing
                </button>
              </div>
            )}
            </>
          )}
        </div>
      </Container>
    </main>
  )
}
