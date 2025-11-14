import { useGamification } from '../hooks/useGamification'
import { Card } from './ui/Card'
import { MARGIN_BOTTOM } from '../constants/spacing'

export const DailyStreakWidget = () => {
  const { dailyGoals, loading } = useGamification()

  if (loading || !dailyGoals) {
    return null
  }

  const { current_streak, longest_streak } = dailyGoals

  return (
    <Card
      variant="default"
      size="default"
      data-testid="daily-streak-widget"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${MARGIN_BOTTOM.xs}`}>
            Daily Streak
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-4xl">🔥</span>
            <div>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {current_streak}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {current_streak === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Best Streak</p>
          <div className="flex items-center space-x-1">
            <span className="text-2xl">👑</span>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {longest_streak}
            </p>
          </div>
        </div>
      </div>
      {current_streak > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Keep it up! Come back tomorrow to continue your streak.
          </p>
        </div>
      )}
    </Card>
  )
}
