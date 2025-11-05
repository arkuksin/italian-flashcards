// src/lib/database.ts
import { supabase } from './supabase'
import { DbWord, DbUserProgress, DbLearningSession } from '../types'

// Words operations
export const getAllWords = async (): Promise<DbWord[]> => {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .order('id')

  if (error) throw error
  return data || []
}

export const getWordsByCategory = async (category: string): Promise<DbWord[]> => {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('category', category)
    .order('id')

  if (error) throw error
  return data || []
}

export const getWordById = async (id: number): Promise<DbWord | null> => {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
  return data
}

// User progress operations
export const getUserProgress = async (userId: string, wordId: number): Promise<DbUserProgress | null> => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('word_id', wordId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
  return data
}

export const getUserProgressForAllWords = async (userId: string): Promise<DbUserProgress[]> => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error
  return data || []
}

export const updateUserProgress = async (
  userId: string,
  wordId: number,
  isCorrect: boolean
): Promise<DbUserProgress> => {
  // First, get current progress or create new entry
  const currentProgress = await getUserProgress(userId, wordId)

  if (currentProgress) {
    // Update existing progress
    const updates = {
      correct_count: isCorrect
        ? currentProgress.correct_count + 1
        : currentProgress.correct_count,
      wrong_count: isCorrect
        ? currentProgress.wrong_count
        : currentProgress.wrong_count + 1,
      last_practiced: new Date().toISOString(),
      mastery_level: calculateMasteryLevel(
        isCorrect ? currentProgress.correct_count + 1 : currentProgress.correct_count,
        isCorrect ? currentProgress.wrong_count : currentProgress.wrong_count + 1
      )
    }

    const { data, error } = await supabase
      .from('user_progress')
      .update(updates)
      .eq('id', currentProgress.id)
      .select()
      .single()

    if (error) throw error
    return data
  } else {
    // Create new progress entry
    const newProgress = {
      user_id: userId,
      word_id: wordId,
      correct_count: isCorrect ? 1 : 0,
      wrong_count: isCorrect ? 0 : 1,
      last_practiced: new Date().toISOString(),
      mastery_level: calculateMasteryLevel(isCorrect ? 1 : 0, isCorrect ? 0 : 1)
    }

    const { data, error } = await supabase
      .from('user_progress')
      .insert(newProgress)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Learning session operations
export const createLearningSession = async (
  userId: string,
  learningDirection: string
): Promise<DbLearningSession> => {
  const sessionData = {
    user_id: userId,
    started_at: new Date().toISOString(),
    learning_direction: learningDirection,
    words_studied: 0,
    correct_answers: 0
  }

  const { data, error } = await supabase
    .from('learning_sessions')
    .insert(sessionData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateLearningSession = async (
  sessionId: string,
  wordsStudied: number,
  correctAnswers: number
): Promise<DbLearningSession> => {
  const { data, error } = await supabase
    .from('learning_sessions')
    .update({
      words_studied: wordsStudied,
      correct_answers: correctAnswers,
      ended_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getUserLearningHistory = async (userId: string): Promise<DbLearningSession[]> => {
  const { data, error } = await supabase
    .from('learning_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Utility functions
function calculateMasteryLevel(correctCount: number, wrongCount: number): number {
  const total = correctCount + wrongCount
  if (total === 0) return 0

  const accuracy = correctCount / total

  // Mastery level from 0 to 5 based on accuracy and practice count
  if (total < 3) return 1 // Beginner
  if (accuracy >= 0.9 && total >= 10) return 5 // Master
  if (accuracy >= 0.8 && total >= 7) return 4 // Advanced
  if (accuracy >= 0.7 && total >= 5) return 3 // Intermediate
  if (accuracy >= 0.5) return 2 // Learning
  return 1 // Struggling
}