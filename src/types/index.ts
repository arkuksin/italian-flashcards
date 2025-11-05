import { Database } from '../lib/database-types'

// Base Word interface - matches database schema
export interface Word {
  id: number;
  russian: string;
  italian: string;
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

export type LearningDirection = 'ru-it' | 'it-ru';
export type SupportedLanguage = 'en' | 'ru' | 'it' | 'de';

export interface AppState {
  currentWordIndex: number;
  userInput: string;
  showAnswer: boolean;
  learningDirection: LearningDirection;
  darkMode: boolean;
  shuffleMode: boolean;
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
}

export interface LearningSession {
  id: string
  user_id: string
  started_at: string
  ended_at: string | null
  words_studied: number
  correct_answers: number
  learning_direction: 'ru-it' | 'it-ru'
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
