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

export type LearningDirection = 'ru-it' | 'it-ru';

export interface Progress {
  correct: number;
  wrong: number;
  streak: number;
  completed: Set<number>;
}

export interface AppState {
  currentWordIndex: number;
  userInput: string;
  showAnswer: boolean;
  progress: Progress;
  learningDirection: LearningDirection;
  darkMode: boolean;
  shuffleMode: boolean;
}