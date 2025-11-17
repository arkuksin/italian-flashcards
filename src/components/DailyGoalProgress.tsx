import { useGamification } from '../hooks/useGamification'
import { useProgress } from '../hooks/useProgress'
import { useMemo } from 'react'
import { Card } from './ui/Card'
import { AriaLabel } from './ui/AriaLabel'
import { MARGIN_BOTTOM } from '../constants/spacing'

export const DailyGoalProgress = () => {
  const { dailyGoals, loading: gamificationLoading } = useGamification()
  const { progress, loading: progressLoading } = useProgress()

  const todayProgress = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    let count = 0

    progress.forEach(p => {
      const lastPracticed = p.last_practiced?.split('T')[0]
      if (lastPracticed === today) {
        count++
      }
    })

    return count
  }, [progress])

  if (gamificationLoading || progressLoading || !dailyGoals) {
    return null
  }

  const target = dailyGoals.target_words_per_day
  const percentage = Math.min((todayProgress / target) * 100, 100)
  const isComplete = todayProgress >= target

  // SVG circle parameters
  const size = 120
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <Card
      variant="default"
      size="default"
      data-testid="daily-goal-progress"
    >
      <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${MARGIN_BOTTOM.md} text-center`}>
        Daily Goal
      </h3>

      <div className="flex flex-col items-center">
        <div
          className="relative"
          style={{ width: size, height: size }}
          role="progressbar"
          aria-label="Daily goal progress"
          aria-valuenow={todayProgress}
          aria-valuemin={0}
          aria-valuemax={target}
        >
          <svg
            width={size}
            height={size}
            className="transform -rotate-90"
            aria-hidden="true"
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-500 ${
                isComplete
                  ? 'text-green-500'
                  : 'text-blue-500'
              }`}
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {todayProgress}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              of {target}
            </p>
          </div>
        </div>

        {isComplete ? (
          <div className="mt-4 flex items-center space-x-2 bg-green-100 dark:bg-green-900 px-4 py-2 rounded-full" role="status">
            <AriaLabel label="Party popper" className="text-2xl">🎉</AriaLabel>
            <p className="text-sm font-semibold text-green-800 dark:text-green-200">
              Goal Complete!
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
            {target - todayProgress} more {target - todayProgress === 1 ? 'word' : 'words'} to reach your goal
          </p>
        )}
      </div>
    </Card>
  )
}
