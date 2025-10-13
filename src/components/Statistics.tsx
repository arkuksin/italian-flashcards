import React from 'react'
import { TrendingUp, Target, Award, Zap } from 'lucide-react'
import { useProgress } from '../hooks/useProgress'

/**
 * Statistics Component
 *
 * Displays user progress statistics from the database
 * - Total words studied
 * - Accuracy percentage
 * - Current streak
 * - Mastered words count
 */
export const Statistics: React.FC = () => {
  const { getStats, loading, error, isOnline } = useProgress()

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    )
  }

  const stats = getStats()

  const statCards = [
    {
      icon: Target,
      label: 'Words Studied',
      value: stats.totalWordsStudied,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      icon: TrendingUp,
      label: 'Accuracy',
      value: `${stats.accuracy}%`,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: Zap,
      label: 'Current Streak',
      value: stats.currentStreak,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      icon: Award,
      label: 'Mastered',
      value: stats.masteredWords,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ]

  return (
    <div data-testid="statistics-component">
      {!isOnline && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Offline mode - Changes will sync when connection is restored
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="progress-stats">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className={`${stat.bgColor} rounded-lg p-4 transition-transform hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                {stat.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Additional Progress Details */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-gray-600 dark:text-gray-400 mb-1">Total Attempts</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {stats.totalAttempts}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-gray-600 dark:text-gray-400 mb-1">In Progress</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {stats.wordsInProgress}
          </div>
        </div>
      </div>
    </div>
  )
}
