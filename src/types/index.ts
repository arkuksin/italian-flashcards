import { Database } from '../lib/database-types'

// Export language types
export * from './languages'
export type { LanguageCode, LanguagePair, LanguagePairStats, MultilingualWord, ExtendedLearningDirection } from './languages'

// Base Word interface - matches database schema
// Note: For multi-language support, use MultilingualWord from './languages'
export interface Word {
  id: number;
  russian: string;
  italian: string;
  german?: string;
  english?: string;
  category: string;
  created_at?: string;
}

// Database types for convenience
export type DbWord = Database['public']['Tables']['words']['Row']
export type DbWordInsert = Database['public']['Tables']['words']['Insert']
export type DbWordUpdate = Database['public']['Tables']['words']['Update']

export type DbUserProgress = Database['public']['Tables']['user_progress']['Row']
export type DbUserProgressInsert = Database['public']['Tables']['user_progress']['Insert']
export type DbUserProgressUpdate = Database['public']['Tables']['user_progress']['Update']

export type DbLearningSession = Database['public']['Tables']['learning_sessions']['Row']
export type DbLearningSessionInsert = Database['public']['Tables']['learning_sessions']['Insert']
export type DbLearningSessionUpdate = Database['public']['Tables']['learning_sessions']['Update']

export type DbUserPreferences = Database['public']['Tables']['user_preferences']['Row']
export type DbUserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert']
export type DbUserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update']

// LearningDirection now supports all language pairs
export type LearningDirection =
  | 'ru-it'
  | 'it-ru'
  | 'de-it'
  | 'it-de'
  | 'en-it'
  | 'it-en';

export type SupportedLanguage = 'en' | 'ru' | 'it' | 'de';

export interface AppState {
  currentWordIndex: number;
  userInput: string;
  showAnswer: boolean;
  learningDirection: LearningDirection;
  darkMode: boolean;
  shuffleMode: boolean;
  accentSensitive: boolean;
}

// Progress tracking types for database integration
export interface WordProgress {
  id: string
  user_id: string
  word_id: number
  correct_count: number
  wrong_count: number
  last_practiced: string
  mastery_level: number // 0-5 (Leitner System levels)
  language_pair_id?: number
}

export interface LearningSession {
  id: string
  user_id: string
  started_at: string
  ended_at: string | null
  words_studied: number
  correct_answers: number
  learning_direction: LearningDirection
  language_pair_id?: number
}

export interface ProgressStats {
  totalWordsStudied: number
  totalAttempts: number
  correctAnswers: number
  accuracy: number
  currentStreak: number
  longestStreak: number
  masteredWords: number
  wordsInProgress: number
}

// Phase 3: Advanced Spaced Repetition Types

/**
 * Difficulty rating for answer feedback
 * 1 = Again (forgot completely)
 * 2 = Hard (difficult to remember)
 * 3 = Good (remembered correctly)
 * 4 = Easy (remembered easily)
 */
export type DifficultyRating = 1 | 2 | 3 | 4

export interface ReviewHistory {
  id: string
  user_id: string
  word_id: number
  review_date: string
  correct: boolean
  response_time_ms?: number
  difficulty_rating?: DifficultyRating
  previous_level: number
  new_level: number
  language_pair_id?: number
}

export type DbReviewHistory = Database['public']['Tables']['review_history']['Row']
export type DbReviewHistoryInsert = Database['public']['Tables']['review_history']['Insert']
export type DbReviewHistoryUpdate = Database['public']['Tables']['review_history']['Update']

export type DbAchievement = Database['public']['Tables']['achievements']['Row']
export type DbAchievementInsert = Database['public']['Tables']['achievements']['Insert']
export type DbAchievementUpdate = Database['public']['Tables']['achievements']['Update']

export type DbDailyGoals = Database['public']['Tables']['daily_goals']['Row']
export type DbDailyGoalsInsert = Database['public']['Tables']['daily_goals']['Insert']
export type DbDailyGoalsUpdate = Database['public']['Tables']['daily_goals']['Update']

// Phase 5: Gamification Types

/**
 * Achievement types for badges and milestones
 */
export type AchievementType =
  | 'FIRST_WORD'           // Studied first word
  | 'STREAK_3'             // 3-day streak
  | 'STREAK_7'             // 7-day streak
  | 'STREAK_30'            // 30-day streak
  | 'STREAK_100'           // 100-day streak
  | 'MASTER_10'            // Mastered 10 words
  | 'MASTER_50'            // Mastered 50 words
  | 'MASTER_100'           // Mastered 100 words
  | 'MASTER_500'           // Mastered 500 words
  | 'SPEED_DEMON'          // 100 reviews in one session
  | 'PERFECTIONIST'        // 50 correct answers in a row
  | 'CATEGORY_MASTER'      // Mastered all words in a category
  | 'EARLY_BIRD'           // Practice before 8 AM
  | 'NIGHT_OWL'            // Practice after 10 PM
  | 'DEDICATED'            // 1000 total reviews
  | 'CHAMPION'             // Reached level 10

export interface Achievement {
  id: string
  user_id: string
  achievement_type: AchievementType
  unlocked_at: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface DailyGoals {
  user_id: string
  target_words_per_day: number
  current_streak: number
  longest_streak: number
  last_practice_date: string | null
  total_xp: number
  level: number
  created_at: string
  updated_at: string
}

export interface AchievementDefinition {
  type: AchievementType
  name: string
  description: string
  icon: string
  xp_reward: number
}

// Phase 9: Category Filter Types

export interface CategoryInfo {
  category: string
  total_words: number
  learned_words: number
  avg_accuracy: number | null
  avg_mastery_level: number | null
}

export interface CategoryPreference {
  id: string
  user_id: string
  category: string
  is_selected: boolean
  priority: number
  last_practiced: string | null
  created_at: string
  updated_at: string
}

export interface CategoryFilter {
  selectedCategories: string[]
  excludedCategories: string[]
}

// Feature: Word of the Day Types

export interface WordOfTheDay {
  id: string
  word_id: number
  russian: string
  italian: string
  category: string
  description: string
  fun_fact?: string
  difficulty_level: number
  date: string
}

export interface WotDProgress {
  id: string
  user_id: string
  wotd_id: string
  viewed_at: string
  completed_at?: string
}

export interface WotDHistoryDay {
  date: string
  completed: boolean
}

// Word Images Types

export type ImageSource = 'unsplash' | 'pexels' | 'custom' | 'ai'
export type ImageTiming = 'always' | 'after_answer' | 'never'
export type ImageSize = 'small' | 'medium' | 'large'

export interface WordImage {
  id: string
  word_id: number
  image_url: string
  thumbnail_url?: string | null
  source: ImageSource
  source_attribution?: string | null
  alt_text: string
  is_primary: boolean
  created_at?: string
}

export interface ImagePreferences {
  show_images: boolean
  image_timing: ImageTiming
  image_size: ImageSize
}

// Phase 10: Due Words Reminders Types

/**
 * Represents a word that is due for review
 */
export interface DueWord {
  word_id: number
  russian: string
  italian: string
  category: string
  mastery_level: number
  last_practiced: string
  due_date: string
  days_overdue: number
}

/**
 * User settings for reminder notifications
 */
export interface ReminderSettings {
  user_id: string
  enabled: boolean
  reminder_time: string // HH:MM:SS format
  timezone: string
  min_due_words: number
  push_enabled: boolean
  email_enabled: boolean
  sms_enabled: boolean
  reminder_days: number[] // 1-7 (1=Monday, 7=Sunday)
  last_reminder_sent?: string
  created_at?: string
  updated_at?: string
}

/**
 * Breakdown of due words by urgency
 */
export interface DueWordsBreakdown {
  overdue: DueWord[] // Words past their due date
  dueToday: DueWord[] // Words due today
  dueSoon: DueWord[] // Words due in next 2 days
  total: number
}

/**
 * History of sent reminders
 */
export interface ReminderHistory {
  id: string
  user_id: string
  sent_at: string
  due_words_count: number
  method: 'push' | 'email' | 'sms'
  opened: boolean
  opened_at?: string
  snoozed_until?: string
}
