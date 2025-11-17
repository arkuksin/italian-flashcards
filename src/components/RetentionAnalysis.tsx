import React from 'react'
import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { RetentionMetrics } from '../services/analyticsService'
import { getMasteryBadgeColors } from '../constants/masteryColors'
import { MARGIN_BOTTOM, VERTICAL_SPACING, PADDING } from '../constants/spacing'

interface RetentionAnalysisProps {
  data: RetentionMetrics
  loading?: boolean
}

/**
 * Phase 4: Retention Analysis Component
 *
 * Analyzes how well users retain learned information:
 * - Overall retention rate
 * - Retention by mastery level
 * - Recent performance trends
 */
export const RetentionAnalysis: React.FC<RetentionAnalysisProps> = ({ data, loading }) => {
  const getTrendIcon = () => {
    if (!data || loading) return null
    switch (data.recentTrend) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
      default:
        return <Minus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    }
  }

  const getTrendColor = () => {
    if (!data || loading) return 'text-blue-600 dark:text-blue-400'
    switch (data.recentTrend) {
      case 'improving':
        return 'text-green-600 dark:text-green-400'
      case 'declining':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-blue-600 dark:text-blue-400'
    }
  }

  const getTrendText = () => {
    if (!data || loading) return 'Loading'
    switch (data.recentTrend) {
      case 'improving':
        return 'Improving'
      case 'declining':
        return 'Needs Attention'
      default:
        return 'Stable'
    }
  }

  const getRetentionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 dark:text-green-400'
    if (rate >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const maxRetentionRate = !loading && data ? Math.max(...data.retentionByLevel.map(l => l.retentionRate), 100) : 100

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${PADDING.comfortable}`} data-testid="retention-analysis">
      <div className={`flex items-center justify-between ${MARGIN_BOTTOM.lg}`}>
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Retention Analysis
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {getTrendText()}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Overall Retention Rate */}
          <div className={MARGIN_BOTTOM.lg}>
            <div className={`flex items-baseline justify-between ${MARGIN_BOTTOM.xs}`}>
              <span className="text-sm text-gray-600 dark:text-gray-400">Overall Retention Rate</span>
              <span className={`text-3xl font-bold ${getRetentionColor(data.overallRetentionRate)}`}>
                {data.overallRetentionRate.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  data.overallRetentionRate >= 80
                    ? 'bg-green-500'
                    : data.overallRetentionRate >= 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(data.overallRetentionRate, 100)}%` }}
              />
            </div>
          </div>

          {/* Retention by Level */}
          {data.retentionByLevel.length > 0 ? (
            <div>
              <h4 className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${MARGIN_BOTTOM.sm}`}>
                Retention by Mastery Level
              </h4>
              <div className={VERTICAL_SPACING.sm}>
                {data.retentionByLevel.map(level => (
                  <div key={level.level}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${getMasteryBadgeColors(level.level)}`}>
                          L{level.level}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {level.totalReviews} reviews
                        </span>
                      </div>
                      <span className={`text-sm font-semibold ${getRetentionColor(level.retentionRate)}`}>
                        {level.retentionRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            level.retentionRate >= 80
                              ? 'bg-green-500'
                              : level.retentionRate >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min((level.retentionRate / maxRetentionRate) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No retention data available yet. Complete some reviews to see your retention analysis!
              </p>
            </div>
          )}

          {/* Insights */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${MARGIN_BOTTOM.xs}`}>
              Insights
            </h4>
            <div className={`${VERTICAL_SPACING.xs} text-sm text-gray-600 dark:text-gray-400`}>
              {data.overallRetentionRate >= 80 && (
                <p className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Excellent retention! You're remembering words very well.</span>
                </p>
              )}
              {data.overallRetentionRate < 60 && (
                <p className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">⚠</span>
                  <span>Consider reviewing more frequently to improve retention.</span>
                </p>
              )}
              {data.recentTrend === 'improving' && (
                <p className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">↑</span>
                  <span>Your performance is improving over time. Keep it up!</span>
                </p>
              )}
              {data.recentTrend === 'declining' && (
                <p className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">↓</span>
                  <span>Performance declining. Try reviewing challenging words more often.</span>
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
