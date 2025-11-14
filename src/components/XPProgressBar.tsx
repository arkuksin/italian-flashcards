import { useGamification } from '../hooks/useGamification'
import { getXPProgress } from '../utils/gamification'
import { MARGIN_BOTTOM, PADDING } from '../constants/spacing'

export const XPProgressBar = () => {
  const { dailyGoals, loading } = useGamification()

  if (loading || !dailyGoals) {
    return null
  }

  const { level, total_xp } = dailyGoals
  const currentLevelXP = (level - 1) * 100
  const nextLevelXP = level * 100
  const progress = getXPProgress(total_xp)
  const xpInCurrentLevel = total_xp - currentLevelXP
  const xpNeededForNext = nextLevelXP - currentLevelXP

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md ${PADDING.comfortable}`}
      data-testid="xp-progress-bar"
    >
      <div className={`flex items-center justify-between ${MARGIN_BOTTOM.xs}`}>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">⭐</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Level {level}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {xpInCurrentLevel} / {xpNeededForNext} XP
          </p>
        </div>
      </div>

      <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
        {Math.round(progress * 100)}% to next level
      </p>
    </div>
  )
}
