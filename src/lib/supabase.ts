import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
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
          learning_direction: string | null
        }
        Insert: {
          id?: string
          user_id: string
          started_at?: string
          ended_at?: string | null
          words_studied?: number
          correct_answers?: number
          learning_direction?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          started_at?: string
          ended_at?: string | null
          words_studied?: number
          correct_answers?: number
          learning_direction?: string | null
        }
      }
    }
  }
}