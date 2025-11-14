import React from 'react'
import { useTranslation } from 'react-i18next'
import { useProgress } from '../hooks/useProgress'
import { useGamification } from '../hooks/useGamification'

/**
 * QuickStats Component
 *
 * Displays compact statistics at the top of the dashboard.
 * Shows key metrics in a concise, scannable format.
 */
export const QuickStats: React.FC = () => {
  const { t } = useTranslation('dashboard')
  const { getStats } = useProgress()
  const { dailyGoals } = useGamification()

  const stats = getStats()

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4" data-testid="quick-stats">
      {/* Words Learned */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
          {t('quickStats.learned')}
        </div>
        <div className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
          {stats.totalWordsStudied}
        </div>
      </div>

      {/* Accuracy */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
          {t('quickStats.accuracy')}
        </div>
        <div className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
          {stats.accuracy}%
        </div>
      </div>

      {/* Current Streak */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
          {t('quickStats.streak')}
        </div>
        <div className="text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">
          {dailyGoals?.current_streak ?? 0} 🔥
        </div>
      </div>

      {/* Level */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
          {t('quickStats.level')}
        </div>
        <div className="text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400">
          {dailyGoals?.level ?? 1}
        </div>
      </div>
    </div>
  )
}
