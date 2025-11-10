import { AchievementType, AchievementDefinition } from '../types'

/**
 * XP calculation constants
 */
export const XP_VALUES = {
  CORRECT_ANSWER: 10,
  WRONG_ANSWER: 2,
  LEVEL_UP: 50,
  DAILY_GOAL_MET: 100,
  STREAK_BONUS: 5, // per day of streak
} as const

/**
 * Calculate XP required for a given level
 * Uses a progressive formula: level * 100
 */
export const getXPForLevel = (level: number): number => {
  return level * 100
}

/**
 * Calculate level from total XP
 */
export const getLevelFromXP = (xp: number): number => {
  return Math.floor(xp / 100) + 1
}

/**
 * Calculate XP progress to next level (0-1)
 */
export const getXPProgress = (xp: number): number => {
  const currentLevel = getLevelFromXP(xp)
  const currentLevelXP = (currentLevel - 1) * 100
  const nextLevelXP = currentLevel * 100
  const progress = (xp - currentLevelXP) / (nextLevelXP - currentLevelXP)
  return Math.min(Math.max(progress, 0), 1)
}

/**
 * Check if two dates are consecutive days
 */
export const areConsecutiveDays = (date1: Date, date2: Date): boolean => {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate())
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate())
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays === 1
}

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

/**
 * Update streak based on last practice date
 */
export const updateStreak = (
  lastPracticeDate: string | null,
  currentStreak: number
): { newStreak: number; streakBroken: boolean } => {
  if (!lastPracticeDate) {
    // First practice ever
    return { newStreak: 1, streakBroken: false }
  }

  const lastDate = new Date(lastPracticeDate)
  const today = new Date()

  // Already practiced today
  if (isToday(lastDate)) {
    return { newStreak: currentStreak, streakBroken: false }
  }

  // Consecutive day
  if (areConsecutiveDays(lastDate, today)) {
    return { newStreak: currentStreak + 1, streakBroken: false }
  }

  // Streak broken
  return { newStreak: 1, streakBroken: true }
}

/**
 * Achievement definitions with metadata
 */
export const ACHIEVEMENT_DEFINITIONS: Record<AchievementType, AchievementDefinition> = {
  FIRST_WORD: {
    type: 'FIRST_WORD',
    name: 'First Steps',
    description: 'Study your first word',
    icon: '🌱',
    xp_reward: 50,
  },
  STREAK_3: {
    type: 'STREAK_3',
    name: 'Getting Started',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    xp_reward: 100,
  },
  STREAK_7: {
    type: 'STREAK_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '⚡',
    xp_reward: 200,
  },
  STREAK_30: {
    type: 'STREAK_30',
    name: 'Month Master',
    description: 'Maintain a 30-day streak',
    icon: '💪',
    xp_reward: 500,
  },
  STREAK_100: {
    type: 'STREAK_100',
    name: 'Legendary',
    description: 'Maintain a 100-day streak',
    icon: '👑',
    xp_reward: 2000,
  },
  MASTER_10: {
    type: 'MASTER_10',
    name: 'Novice',
    description: 'Master 10 words',
    icon: '📚',
    xp_reward: 100,
  },
  MASTER_50: {
    type: 'MASTER_50',
    name: 'Scholar',
    description: 'Master 50 words',
    icon: '🎓',
    xp_reward: 300,
  },
  MASTER_100: {
    type: 'MASTER_100',
    name: 'Expert',
    description: 'Master 100 words',
    icon: '🏆',
    xp_reward: 500,
  },
  MASTER_500: {
    type: 'MASTER_500',
    name: 'Grand Master',
    description: 'Master 500 words',
    icon: '💎',
    xp_reward: 2000,
  },
  SPEED_DEMON: {
    type: 'SPEED_DEMON',
    name: 'Speed Demon',
    description: 'Complete 100 reviews in one session',
    icon: '⚡',
    xp_reward: 300,
  },
  PERFECTIONIST: {
    type: 'PERFECTIONIST',
    name: 'Perfectionist',
    description: 'Get 50 correct answers in a row',
    icon: '✨',
    xp_reward: 500,
  },
  CATEGORY_MASTER: {
    type: 'CATEGORY_MASTER',
    name: 'Category Master',
    description: 'Master all words in a category',
    icon: '🎯',
    xp_reward: 400,
  },
  EARLY_BIRD: {
    type: 'EARLY_BIRD',
    name: 'Early Bird',
    description: 'Practice before 8 AM',
    icon: '🌅',
    xp_reward: 50,
  },
  NIGHT_OWL: {
    type: 'NIGHT_OWL',
    name: 'Night Owl',
    description: 'Practice after 10 PM',
    icon: '🦉',
    xp_reward: 50,
  },
  DEDICATED: {
    type: 'DEDICATED',
    name: 'Dedicated',
    description: 'Complete 1000 total reviews',
    icon: '💯',
    xp_reward: 1000,
  },
  CHAMPION: {
    type: 'CHAMPION',
    name: 'Champion',
    description: 'Reach level 10',
    icon: '👑',
    xp_reward: 1000,
  },
}

/**
 * Check which achievements a user should unlock based on their stats
 */
export const checkAchievements = (stats: {
  totalReviews: number
  masteredWords: number
  currentStreak: number
  sessionReviews: number
  consecutiveCorrect: number
  level: number
  currentHour: number
  categoriesCompleted: string[]
}): AchievementType[] => {
  const achievements: AchievementType[] = []

  // First word
  if (stats.totalReviews === 1) {
    achievements.push('FIRST_WORD')
  }

  // Streak achievements
  if (stats.currentStreak >= 100) {
    achievements.push('STREAK_100')
  } else if (stats.currentStreak >= 30) {
    achievements.push('STREAK_30')
  } else if (stats.currentStreak >= 7) {
    achievements.push('STREAK_7')
  } else if (stats.currentStreak >= 3) {
    achievements.push('STREAK_3')
  }

  // Mastery achievements
  if (stats.masteredWords >= 500) {
    achievements.push('MASTER_500')
  } else if (stats.masteredWords >= 100) {
    achievements.push('MASTER_100')
  } else if (stats.masteredWords >= 50) {
    achievements.push('MASTER_50')
  } else if (stats.masteredWords >= 10) {
    achievements.push('MASTER_10')
  }

  // Session achievements
  if (stats.sessionReviews >= 100) {
    achievements.push('SPEED_DEMON')
  }

  if (stats.consecutiveCorrect >= 50) {
    achievements.push('PERFECTIONIST')
  }

  // Time-based achievements
  if (stats.currentHour < 8) {
    achievements.push('EARLY_BIRD')
  } else if (stats.currentHour >= 22) {
    achievements.push('NIGHT_OWL')
  }

  // Total reviews
  if (stats.totalReviews >= 1000) {
    achievements.push('DEDICATED')
  }

  // Level achievement
  if (stats.level >= 10) {
    achievements.push('CHAMPION')
  }

  // Category completion
  if (stats.categoriesCompleted.length > 0) {
    achievements.push('CATEGORY_MASTER')
  }

  return achievements
}
