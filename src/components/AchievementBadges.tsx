import { useGamification } from '../hooks/useGamification'
import { ACHIEVEMENT_DEFINITIONS } from '../utils/gamification'
import { AchievementType } from '../types'
import { Card } from './ui/Card'
import { MARGIN_BOTTOM, GAP } from '../constants/spacing'

export const AchievementBadges = ({ maxDisplay = 6 }: { maxDisplay?: number }) => {
  const { achievements, loading } = useGamification()

  if (loading) {
    return null
  }

  const recentAchievements = achievements.slice(0, maxDisplay)
  const totalUnlocked = achievements.length

  return (
    <Card
      variant="default"
      size="default"
      data-testid="achievement-badges"
    >
      <div className={`flex items-center justify-between ${MARGIN_BOTTOM.md}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Achievements
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {totalUnlocked} unlocked
        </span>
      </div>

      {recentAchievements.length === 0 ? (
        <div className="text-center py-8">
          <p className={`text-gray-500 dark:text-gray-400 ${MARGIN_BOTTOM.xs}`}>No achievements yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Start studying to unlock your first achievement!
          </p>
        </div>
      ) : (
        <div className={`grid grid-cols-2 sm:grid-cols-3 ${GAP.md}`}>
          {recentAchievements.map(achievement => {
            const definition = ACHIEVEMENT_DEFINITIONS[achievement.achievement_type as AchievementType]
            return (
              <Card
                key={achievement.id}
                variant="flat"
                size="compact"
                className="flex flex-col items-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                data-testid={`achievement-${achievement.achievement_type}`}
              >
                <span className="text-4xl mb-2">{definition.icon}</span>
                <p className="text-sm font-semibold text-gray-900 dark:text-white text-center">
                  {definition.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-1">
                  {definition.description}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  +{definition.xp_reward} XP
                </p>
              </Card>
            )
          })}
        </div>
      )}

      {totalUnlocked > maxDisplay && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            +{totalUnlocked - maxDisplay} more achievements
          </p>
        </div>
      )}
    </Card>
  )
}
