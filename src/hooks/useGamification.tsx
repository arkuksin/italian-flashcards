import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Achievement, DailyGoals, AchievementType } from '../types'
import {
  updateStreak,
  checkAchievements,
  getLevelFromXP,
  XP_VALUES,
  ACHIEVEMENT_DEFINITIONS,
} from '../utils/gamification'

interface GamificationContextValue {
  dailyGoals: DailyGoals | null
  achievements: Achievement[]
  loading: boolean
  error: string | null
  updateDailyProgress: (correct: boolean) => Promise<void>
  unlockAchievement: (achievementType: AchievementType, metadata?: Record<string, unknown>) => Promise<void>
  checkAndUnlockAchievements: (stats: {
    totalReviews: number
    masteredWords: number
    currentStreak: number
    sessionReviews: number
    consecutiveCorrect: number
    level: number
    currentHour: number
    categoriesCompleted: string[]
  }) => Promise<void>
  refreshGamification: () => Promise<void>
}

const GamificationContext = createContext<GamificationContextValue | undefined>(undefined)

const useProvideGamification = (): GamificationContextValue => {
  const { user } = useAuth()
  const [dailyGoals, setDailyGoals] = useState<DailyGoals | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDailyGoals = useCallback(async () => {
    if (!user) {
      setDailyGoals(null)
      return
    }

    try {
      const { data, error: supabaseError } = await supabase
        .from('daily_goals')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (supabaseError && supabaseError.code !== 'PGRST116') {
        // Table might not exist (migration not run) - gracefully degrade
        console.warn('Daily goals table not available, gamification features disabled:', supabaseError)
        setDailyGoals(null)
        return
      }

      if (!data) {
        // Create default daily goals for new user
        const { data: newGoals, error: insertError } = await supabase
          .from('daily_goals')
          .insert({
            user_id: user.id,
            target_words_per_day: 20,
            current_streak: 0,
            longest_streak: 0,
            total_xp: 0,
            level: 1,
          })
          .select()
          .single()

        if (insertError) {
          console.warn('Cannot create daily goals (table may not exist):', insertError)
          setDailyGoals(null)
          return
        }
        setDailyGoals(newGoals)
      } else {
        setDailyGoals(data)
      }
    } catch (err) {
      // Gracefully degrade instead of showing error
      console.warn('Daily goals unavailable, continuing without gamification:', err)
      setDailyGoals(null)
    }
  }, [user])

  const loadAchievements = useCallback(async () => {
    if (!user) {
      setAchievements([])
      return
    }

    try {
      const { data, error: supabaseError } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false })

      if (supabaseError) {
        // Table might not exist (migration not run) - gracefully degrade
        console.warn('Achievements table not available, continuing without achievements:', supabaseError)
        setAchievements([])
        return
      }

      setAchievements(data || [])
    } catch (err) {
      // Gracefully degrade instead of showing error
      console.warn('Achievements unavailable, continuing without them:', err)
      setAchievements([])
    }
  }, [user])

  const loadGamification = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([loadDailyGoals(), loadAchievements()])
    } finally {
      setLoading(false)
    }
  }, [loadDailyGoals, loadAchievements])

  useEffect(() => {
    loadGamification()
  }, [loadGamification])

  const updateDailyProgress = useCallback(
    async (correct: boolean) => {
      if (!user || !dailyGoals) return

      try {
        const today = new Date().toISOString().split('T')[0]
        const { newStreak, streakBroken } = updateStreak(
          dailyGoals.last_practice_date,
          dailyGoals.current_streak
        )

        // Calculate XP earned
        let xpEarned = correct ? XP_VALUES.CORRECT_ANSWER : XP_VALUES.WRONG_ANSWER

        // Add streak bonus if applicable
        if (newStreak > 1) {
          xpEarned += Math.min(newStreak * XP_VALUES.STREAK_BONUS, 100)
        }

        const newTotalXp = dailyGoals.total_xp + xpEarned
        const newLevel = getLevelFromXP(newTotalXp)

        // Level up bonus
        if (newLevel > dailyGoals.level) {
          xpEarned += XP_VALUES.LEVEL_UP
        }

        const updatedGoals = {
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, dailyGoals.longest_streak),
          last_practice_date: today,
          total_xp: newTotalXp + (newLevel > dailyGoals.level ? XP_VALUES.LEVEL_UP : 0),
          level: newLevel,
        }

        const { data, error: updateError } = await supabase
          .from('daily_goals')
          .update(updatedGoals)
          .eq('user_id', user.id)
          .select()
          .single()

        if (updateError) throw updateError

        setDailyGoals(data)

        // Check for streak achievements
        if (newStreak > dailyGoals.current_streak && !streakBroken) {
          if (newStreak === 3) await unlockAchievement('STREAK_3')
          if (newStreak === 7) await unlockAchievement('STREAK_7')
          if (newStreak === 30) await unlockAchievement('STREAK_30')
          if (newStreak === 100) await unlockAchievement('STREAK_100')
        }

        // Check for level achievement
        if (newLevel >= 10 && dailyGoals.level < 10) {
          await unlockAchievement('CHAMPION')
        }
      } catch (err) {
        // Gracefully handle errors (table may not exist in preview environments)
        console.warn('Unable to update daily progress (gamification may be unavailable):', err)
        // Don't set error state - just continue without gamification
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, dailyGoals]
  )

  const unlockAchievement = useCallback(
    async (achievementType: AchievementType, metadata?: Record<string, unknown>) => {
      if (!user) return

      try {
        // Check if already unlocked
        const existing = achievements.find(a => a.achievement_type === achievementType)
        if (existing) return

        const { data, error: insertError } = await supabase
          .from('achievements')
          .insert({
            user_id: user.id,
            achievement_type: achievementType,
            metadata: metadata || {},
          })
          .select()
          .single()

        if (insertError) {
          // Ignore duplicate key errors
          if (insertError.code !== '23505') {
            throw insertError
          }
          return
        }

        // Add XP reward
        const xpReward = ACHIEVEMENT_DEFINITIONS[achievementType].xp_reward
        if (dailyGoals) {
          const newTotalXp = dailyGoals.total_xp + xpReward
          const newLevel = getLevelFromXP(newTotalXp)

          await supabase
            .from('daily_goals')
            .update({
              total_xp: newTotalXp,
              level: newLevel,
            })
            .eq('user_id', user.id)

          setDailyGoals({
            ...dailyGoals,
            total_xp: newTotalXp,
            level: newLevel,
          })
        }

        setAchievements(prev => [data, ...prev])
      } catch (err) {
        console.error('Error unlocking achievement:', err)
      }
    },
    [user, achievements, dailyGoals]
  )

  const checkAndUnlockAchievements = useCallback(
    async (stats: {
      totalReviews: number
      masteredWords: number
      currentStreak: number
      sessionReviews: number
      consecutiveCorrect: number
      level: number
      currentHour: number
      categoriesCompleted: string[]
    }) => {
      const eligibleAchievements = checkAchievements(stats)

      for (const achievementType of eligibleAchievements) {
        const alreadyUnlocked = achievements.some(a => a.achievement_type === achievementType)
        if (!alreadyUnlocked) {
          await unlockAchievement(achievementType)
        }
      }
    },
    [achievements, unlockAchievement]
  )

  const refreshGamification = useCallback(async () => {
    await loadGamification()
  }, [loadGamification])

  return {
    dailyGoals,
    achievements,
    loading,
    error,
    updateDailyProgress,
    unlockAchievement,
    checkAndUnlockAchievements,
    refreshGamification,
  }
}

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
  const gamification = useProvideGamification()
  return (
    <GamificationContext.Provider value={gamification}>
      {children}
    </GamificationContext.Provider>
  )
}

export const useGamification = () => {
  const context = useContext(GamificationContext)
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider')
  }
  return context
}
