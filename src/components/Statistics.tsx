import React from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, Target, Award, Zap } from 'lucide-react'
import { useProgress } from '../hooks/useProgress'
import { BoxDistributionChart } from './BoxDistributionChart'
import { Card } from './ui/Card'
import { MARGIN_BOTTOM, GAP, VERTICAL_SPACING, PADDING, SPACING_PATTERNS } from '../constants/spacing'

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
  const { t } = useTranslation('dashboard')
  const { getStats, loading, error, isOnline } = useProgress()

  if (loading) {
    return (
      <div className={`animate-pulse ${VERTICAL_SPACING.md}`}>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    )
  }

  const stats = getStats()

  const statCards = [
    {
      icon: Target,
      label: t('overview.wordsLearned'),
      value: stats.totalWordsStudied,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      icon: TrendingUp,
      label: t('overview.accuracy'),
      value: `${stats.accuracy}%`,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: Zap,
      label: t('overview.currentStreak'),
      value: stats.currentStreak,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      icon: Award,
      label: t('stats.mastered'),
      value: stats.masteredWords,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ]

  return (
    <div data-testid="statistics-component">
      {!isOnline && (
        <div className={`${MARGIN_BOTTOM.md} ${PADDING.compact} bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg`}>
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ {t('stats.offlineMode')}
          </p>
        </div>
      )}

      {error && (
        <div className={`${MARGIN_BOTTOM.md} ${PADDING.compact} bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg`}>
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className={`grid grid-cols-2 lg:grid-cols-4 ${GAP.md}`} data-testid="progress-stats">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card
              key={index}
              variant="flat"
              size="compact"
              className={`${stat.bgColor} transition-transform hover:scale-105`}
            >
              <div className={`flex items-center justify-between ${MARGIN_BOTTOM.xs}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-bold text-gray-900 dark:text-white ${SPACING_PATTERNS.listItem}`}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                {stat.label}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Additional Progress Details */}
      <div className={`mt-6 grid grid-cols-2 ${GAP.md} text-sm`}>
        <Card variant="default" size="compact">
          <div className={`text-gray-600 dark:text-gray-400 ${SPACING_PATTERNS.listItem}`}>{t('stats.totalAttempts')}</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {stats.totalAttempts}
          </div>
        </Card>
        <Card variant="default" size="compact">
          <div className={`text-gray-600 dark:text-gray-400 ${SPACING_PATTERNS.listItem}`}>{t('stats.inProgress')}</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {stats.wordsInProgress}
          </div>
        </Card>
      </div>

      {/* Phase 2: Leitner Box Distribution Chart */}
      <div className={MARGIN_BOTTOM.lg}>
        <BoxDistributionChart />
      </div>
    </div>
  )
}
