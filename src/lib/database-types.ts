// Database type definitions
export type Database = {
  public: {
    Tables: {
      words: {
        Row: {
          id: number
          russian: string
          italian: string
          category: string
          created_at: string
        }
        Insert: {
          id?: number
          russian: string
          italian: string
          category: string
          created_at?: string
        }
        Update: {
          id?: number
          russian?: string
          italian?: string
          category?: string
          created_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          word_id: number
          correct_count: number
          wrong_count: number
          last_practiced: string
          mastery_level: number
        }
        Insert: {
          id?: string
          user_id: string
          word_id: number
          correct_count?: number
          wrong_count?: number
          last_practiced?: string
          mastery_level?: number
        }
        Update: {
          id?: string
          user_id?: string
          word_id?: number
          correct_count?: number
          wrong_count?: number
          last_practiced?: string
          mastery_level?: number
        }
      }
      learning_sessions: {
        Row: {
          id: string
          user_id: string
          started_at: string
          ended_at: string | null
          words_studied: number
          correct_answers: number
          learning_direction: string
        }
        Insert: {
          id?: string
          user_id: string
          started_at?: string
          ended_at?: string | null
          words_studied?: number
          correct_answers?: number
          learning_direction?: string
        }
        Update: {
          id?: string
          user_id?: string
          started_at?: string
          ended_at?: string | null
          words_studied?: number
          correct_answers?: number
          learning_direction?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          dark_mode: boolean
          default_learning_direction: string
          shuffle_mode: boolean
          daily_goal: number
          notification_enabled: boolean
          language_preference: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          dark_mode?: boolean
          default_learning_direction?: string
          shuffle_mode?: boolean
          daily_goal?: number
          notification_enabled?: boolean
          language_preference?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          dark_mode?: boolean
          default_learning_direction?: string
          shuffle_mode?: boolean
          daily_goal?: number
          notification_enabled?: boolean
          language_preference?: string
          created_at?: string
          updated_at?: string
        }
      }
      review_history: {
        Row: {
          id: string
          user_id: string
          word_id: number
          review_date: string
          correct: boolean
          response_time_ms: number | null
          difficulty_rating: number | null
          previous_level: number
          new_level: number
        }
        Insert: {
          id?: string
          user_id: string
          word_id: number
          review_date?: string
          correct: boolean
          response_time_ms?: number | null
          difficulty_rating?: number | null
          previous_level: number
          new_level: number
        }
        Update: {
          id?: string
          user_id?: string
          word_id?: number
          review_date?: string
          correct?: boolean
          response_time_ms?: number | null
          difficulty_rating?: number | null
          previous_level?: number
          new_level?: number
        }
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type: string
          unlocked_at: string
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_type: string
          unlocked_at?: string
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_type?: string
          unlocked_at?: string
          metadata?: Record<string, unknown>
          created_at?: string
        }
      }
      daily_goals: {
        Row: {
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
        Insert: {
          user_id: string
          target_words_per_day?: number
          current_streak?: number
          longest_streak?: number
          last_practice_date?: string | null
          total_xp?: number
          level?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          target_words_per_day?: number
          current_streak?: number
          longest_streak?: number
          last_practice_date?: string | null
          total_xp?: number
          level?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}