import { useState, useEffect } from 'react'
import { Clock, AlertCircle, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { reminderService } from '../services/reminderService'
import type { DueWordsBreakdown } from '../types'
import type { User } from '@supabase/supabase-js'
import { Card } from './ui/Card'
import { MARGIN_BOTTOM } from '../constants/spacing'

interface DueWordsWidgetProps {
  user: User | null
}

/**
 * Widget that displays due words breakdown on the dashboard
 * Shows overdue, due today, and due soon words with urgency color coding
 */
export const DueWordsWidget = ({ user }: DueWordsWidgetProps) => {
  const [breakdown, setBreakdown] = useState<DueWordsBreakdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    loadDueWords()
  }, [user])

  const loadDueWords = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user) {
        setLoading(false)
        return
      }

      const data = await reminderService.getDueWordsBreakdown(user.id)
      setBreakdown(data)
    } catch (err) {
      console.error('Error loading due words:', err)
      setError('Failed to load due words')
    } finally {
      setLoading(false)
    }
  }

  const handlePractice = () => {
    // Navigate to practice with due words filter
    navigate('/practice?filter=due')
  }

  if (loading) {
    return (
      <Card
        variant="default"
        size="default"
        className="animate-pulse"
        data-testid="due-words-widget-loading"
      >
        <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded"></div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card
        variant="default"
        size="default"
        className="border-red-200 dark:border-red-800"
        data-testid="due-words-widget-error"
      >
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="w-6 h-6" />
          <div>
            <h3 className={`font-semibold ${MARGIN_BOTTOM.xs}`}>Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  // No due words - show success state
  if (!breakdown || breakdown.total === 0) {
    return (
      <Card
        variant="default"
        size="default"
        className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
        data-testid="due-words-widget-empty"
      >
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <h3 className={`font-semibold text-green-800 dark:text-green-300 ${MARGIN_BOTTOM.xs}`}>
              {t('reminders.allCaughtUp', 'All caught up!')}
            </h3>
            <p className="text-sm text-green-700 dark:text-green-400">
              {t('reminders.noDueWords', 'No words are due for review. Great job!')} 🎉
            </p>
          </div>
        </div>
      </Card>
    )
  }

  // Determine urgency based on overdue count
  const urgencyColor =
    breakdown.overdue.length > 10 ? 'red' :
    breakdown.overdue.length > 0 ? 'yellow' :
    'blue'

  const colorClasses = {
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-300',
      badge: 'bg-red-500 dark:bg-red-600',
      badgeHover: 'hover:bg-red-600 dark:hover:bg-red-700'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-300',
      badge: 'bg-yellow-500 dark:bg-yellow-600',
      badgeHover: 'hover:bg-yellow-600 dark:hover:bg-yellow-700'
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-300',
      badge: 'bg-blue-500 dark:bg-blue-600',
      badgeHover: 'hover:bg-blue-600 dark:hover:bg-blue-700'
    }
  }

  const colors = colorClasses[urgencyColor]

  return (
    <Card
      variant="default"
      size="default"
      className={`${colors.bg} ${colors.border}`}
      data-testid="due-words-widget"
    >
      {/* Header */}
      <div className={`flex items-center gap-3 ${MARGIN_BOTTOM.md}`}>
        <Clock className={`w-6 h-6 ${colors.text}`} />
        <h3 className={`text-lg font-bold ${colors.text}`}>
          {t('reminders.dueWords', 'Due Words')}
        </h3>
      </div>

      {/* Total count badge */}
      <div className={`text-center ${MARGIN_BOTTOM.md}`}>
        <div className={`inline-flex items-center justify-center w-20 h-20 ${colors.badge} text-white rounded-full text-3xl font-bold mb-2`}>
          {breakdown.total}
        </div>
        <p className={`text-sm ${colors.text}`}>
          {t('reminders.wordsWaiting', 'words waiting for review')}
        </p>
      </div>

      {/* Breakdown */}
      <div className={`space-y-2 ${MARGIN_BOTTOM.md}`}>
        {breakdown.overdue.length > 0 && (
          <div className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {t('reminders.overdue', 'Overdue')}
              </span>
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {breakdown.overdue.length}
            </span>
          </div>
        )}
        {breakdown.dueToday.length > 0 && (
          <div className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {t('reminders.dueToday', 'Due today')}
              </span>
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {breakdown.dueToday.length}
            </span>
          </div>
        )}
        {breakdown.dueSoon.length > 0 && (
          <div className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {t('reminders.dueSoon', 'Due soon')}
              </span>
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {breakdown.dueSoon.length}
            </span>
          </div>
        )}
      </div>

      {/* Practice button */}
      <button
        onClick={handlePractice}
        className={`w-full py-3 px-4 ${colors.badge} ${colors.badgeHover} text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800`}
        data-testid="practice-due-words-button"
      >
        🎯 {t('reminders.practiceNow', 'Practice Now')}
      </button>

      {/* Warning for many overdue words */}
      {breakdown.overdue.length > 5 && (
        <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400">
              {t('reminders.overdueWarning', {
                count: breakdown.overdue.length,
                defaultValue: 'You have {{count}} overdue words. Regular practice improves retention!'
              })}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}
