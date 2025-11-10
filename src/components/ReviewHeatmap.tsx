import React from 'react'
import { Calendar } from 'lucide-react'
import { ReviewHeatmapData } from '../services/analyticsService'

interface ReviewHeatmapProps {
  data: ReviewHeatmapData[]
  loading?: boolean
}

/**
 * Phase 4: Review Heatmap Component
 *
 * Displays a calendar heatmap of review activity:
 * - Daily review counts
 * - Accuracy visualization
 * - Activity patterns over time
 */
export const ReviewHeatmap: React.FC<ReviewHeatmapProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  // Create a map of dates to data
  const dataMap = new Map<string, ReviewHeatmapData>()
  data.forEach(item => {
    dataMap.set(item.date, item)
  })

  // Get date range
  const today = new Date()
  const startDate = new Date()
  startDate.setDate(today.getDate() - 89) // Last 90 days

  // Generate all dates in range
  const dates: Date[] = []
  const currentDate = new Date(startDate)
  while (currentDate <= today) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Group by weeks
  const weeks: Date[][] = []
  let currentWeek: Date[] = []

  // Add empty cells at the beginning to align with the week
  const firstDayOfWeek = dates[0].getDay()
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(new Date(0)) // Placeholder date
  }

  dates.forEach(date => {
    currentWeek.push(date)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })

  // Add remaining days
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(new Date(0)) // Placeholder date
    }
    weeks.push(currentWeek)
  }

  const getIntensityClass = (reviewCount: number, accuracy: number) => {
    if (reviewCount === 0) {
      return 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
    }

    // Color based on accuracy
    if (accuracy >= 80) {
      if (reviewCount >= 20) return 'bg-green-600 dark:bg-green-500'
      if (reviewCount >= 10) return 'bg-green-500 dark:bg-green-400'
      if (reviewCount >= 5) return 'bg-green-400 dark:bg-green-300'
      return 'bg-green-300 dark:bg-green-200'
    } else if (accuracy >= 60) {
      if (reviewCount >= 20) return 'bg-yellow-600 dark:bg-yellow-500'
      if (reviewCount >= 10) return 'bg-yellow-500 dark:bg-yellow-400'
      if (reviewCount >= 5) return 'bg-yellow-400 dark:bg-yellow-300'
      return 'bg-yellow-300 dark:bg-yellow-200'
    } else {
      if (reviewCount >= 20) return 'bg-red-600 dark:bg-red-500'
      if (reviewCount >= 10) return 'bg-red-500 dark:bg-red-400'
      if (reviewCount >= 5) return 'bg-red-400 dark:bg-red-300'
      return 'bg-red-300 dark:bg-red-200'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const maxReviews = Math.max(...data.map(d => d.reviewCount), 1)
  const totalReviews = data.reduce((sum, d) => sum + d.reviewCount, 0)
  const activeDays = data.filter(d => d.reviewCount > 0).length

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6" data-testid="review-heatmap">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Review Activity
          </h3>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last 90 days
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Reviews</div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalReviews}</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">Active Days</div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{activeDays}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <div className="text-xs text-green-600 dark:text-green-400 mb-1">Peak Day</div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">{maxReviews}</div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Day labels */}
          <div className="flex mb-2">
            <div className="w-8"></div>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
              <div key={i} className="flex-1 text-xs text-gray-500 dark:text-gray-400 text-center min-w-[12px]">
                {i % 2 === 1 ? day : ''}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="space-y-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex gap-1">
                {/* Month label */}
                <div className="w-8 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  {weekIndex === 0 || week[0].getDate() <= 7 ?
                    week[0].toLocaleDateString('en-US', { month: 'short' }) : ''}
                </div>

                {/* Day cells */}
                {week.map((date, dayIndex) => {
                  const isPlaceholder = date.getTime() === 0
                  const dateStr = date.toISOString().split('T')[0]
                  const dayData = dataMap.get(dateStr)
                  const reviewCount = dayData?.reviewCount || 0
                  const accuracy = dayData?.accuracy || 0

                  return (
                    <div
                      key={dayIndex}
                      className={`
                        w-3 h-3 rounded-sm transition-all duration-200 hover:scale-150 hover:z-10 relative group
                        ${isPlaceholder ? 'invisible' : ''}
                        ${!isPlaceholder ? getIntensityClass(reviewCount, accuracy) : ''}
                      `}
                      title={
                        isPlaceholder
                          ? ''
                          : `${formatDate(date)}: ${reviewCount} reviews${reviewCount > 0 ? ` (${accuracy.toFixed(0)}% accuracy)` : ''}`
                      }
                    >
                      {/* Tooltip on hover */}
                      {!isPlaceholder && reviewCount > 0 && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20">
                          {formatDate(date)}<br />
                          {reviewCount} reviews ({accuracy.toFixed(0)}%)
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-300 dark:bg-green-200 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-400 dark:bg-green-300 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-600 dark:bg-green-500 rounded-sm"></div>
          </div>
          <span>More</span>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          Green = High accuracy (≥80%), Yellow = Medium (60-79%), Red = Needs improvement (&lt;60%)
        </div>
      </div>
    </div>
  )
}
