import React from 'react'
import { TrendingUp } from 'lucide-react'
import { LearningVelocityData } from '../services/analyticsService'
import { MARGIN_BOTTOM, GAP, PADDING } from '../constants/spacing'
import { ChartSkeleton } from './ui/skeletons/ChartSkeleton'

interface LearningVelocityChartProps {
  data: LearningVelocityData[]
  loading?: boolean
}

/**
 * Phase 4: Learning Velocity Chart Component
 *
 * Visualizes learning progress over time:
 * - Words reviewed per week
 * - Words mastered per week
 * - Accuracy trends
 */
export const LearningVelocityChart: React.FC<LearningVelocityChartProps> = ({ data, loading }) => {
  if (loading) {
    return <ChartSkeleton />
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Learning Velocity
          </h3>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No data available yet. Start practicing to see your learning velocity!
        </p>
      </div>
    )
  }

  // Find max values for scaling
  const maxReviewed = Math.max(...data.map(d => d.wordsReviewed), 1)
  const maxMastered = Math.max(...data.map(d => d.wordsMastered), 1)
  const maxValue = Math.max(maxReviewed, maxMastered, 10)

  // Calculate overall trends
  const totalReviewed = data.reduce((sum, d) => sum + d.wordsReviewed, 0)
  const totalMastered = data.reduce((sum, d) => sum + d.wordsMastered, 0)
  const averageAccuracy = data.reduce((sum, d) => sum + d.accuracy, 0) / data.length

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${PADDING.comfortable}`} data-testid="learning-velocity-chart">
      <div className={`flex items-center justify-between ${MARGIN_BOTTOM.lg}`}>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Learning Velocity
          </h3>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last {data.length} weeks
        </div>
      </div>

      {/* Summary Cards */}
      <div className={`grid grid-cols-3 ${GAP.md} ${MARGIN_BOTTOM.lg}`}>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Reviewed</div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalReviewed}</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">Total Mastered</div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{totalMastered}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <div className="text-xs text-green-600 dark:text-green-400 mb-1">Avg Accuracy</div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {averageAccuracy.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className={`flex ${GAP.md} ${MARGIN_BOTTOM.md} text-sm`}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-gray-700 dark:text-gray-300">Words Reviewed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span className="text-gray-700 dark:text-gray-300">Words Mastered</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className={VERTICAL_SPACING.sm}>
        {data.map((week) => (
          <div key={week.weekStart} className="group">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-xs text-gray-500 dark:text-gray-400 w-16">
                {week.weekLabel}
              </div>
              <div className="flex-1 flex gap-1">
                {/* Words Reviewed Bar */}
                <div
                  className="bg-blue-500 rounded-sm h-6 transition-all duration-300 hover:bg-blue-600 flex items-center justify-end px-2"
                  style={{ width: `${(week.wordsReviewed / maxValue) * 100}%`, minWidth: week.wordsReviewed > 0 ? '24px' : '0' }}
                  title={`${week.wordsReviewed} words reviewed`}
                >
                  {week.wordsReviewed > 0 && (
                    <span className="text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {week.wordsReviewed}
                    </span>
                  )}
                </div>
                {/* Words Mastered Bar */}
                <div
                  className="bg-purple-500 rounded-sm h-6 transition-all duration-300 hover:bg-purple-600 flex items-center justify-end px-2"
                  style={{ width: `${(week.wordsMastered / maxValue) * 100}%`, minWidth: week.wordsMastered > 0 ? '24px' : '0' }}
                  title={`${week.wordsMastered} words mastered`}
                >
                  {week.wordsMastered > 0 && (
                    <span className="text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {week.wordsMastered}
                    </span>
                  )}
                </div>
              </div>
              {/* Accuracy Badge */}
              <div
                className={`text-xs font-medium px-2 py-1 rounded ${
                  week.accuracy >= 80
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : week.accuracy >= 60
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                }`}
              >
                {week.accuracy.toFixed(0)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scale Reference */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>0</span>
          <span>{Math.ceil(maxValue / 2)}</span>
          <span>{maxValue} words</span>
        </div>
      </div>
    </div>
  )
}
