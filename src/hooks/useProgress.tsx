import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { WordProgress, ProgressStats } from '../types'
import { calculateMasteryLevel, getDueWords as getDueWordsUtil } from '../utils/spacedRepetition'

type OfflineQueueItem = {
  type: 'progress' | 'session'
  data: unknown
}

interface ProgressContextValue {
  progress: Map<number, WordProgress>
  loading: boolean
  error: string | null
  isOnline: boolean
  currentSession: string | null
  sessionStats: {
    wordsStudied: number
    correctAnswers: number
  }
  loadProgress: () => Promise<void>
  updateProgress: (wordId: number, correct: boolean) => Promise<void>
  startSession: (learningDirection: 'ru-it' | 'it-ru') => Promise<string | null>
  endSession: () => Promise<void>
  getStats: () => ProgressStats
  getDueWords: (allWords: number[]) => number[]
  refreshProgress: () => Promise<void>
  hasOfflineChanges: boolean
}

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined)

const defaultOnlineStatus = typeof navigator !== 'undefined' ? navigator.onLine : true

const useProvideProgress = (): ProgressContextValue => {
  const { user } = useAuth()
  const [progress, setProgress] = useState<Map<number, WordProgress>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentSession, setCurrentSession] = useState<string | null>(null)
  const [sessionStats, setSessionStats] = useState({
    wordsStudied: 0,
    correctAnswers: 0,
  })
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([])
  const [isOnline, setIsOnline] = useState(defaultOnlineStatus)

  const loadProgress = useCallback(async () => {
    setLoading(true)

    if (!user) {
      setProgress(new Map())
      setLoading(false)
      return
    }

    try {
      setError(null)
      const { data, error: supabaseError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)

      if (supabaseError) throw supabaseError

      const progressMap = new Map<number, WordProgress>()
      data?.forEach(item => {
        progressMap.set(item.word_id, item)
      })

      setProgress(progressMap)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load progress'
      console.error('Error loading progress:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  const processOfflineQueue = useCallback(async () => {
    if (!isOnline || offlineQueue.length === 0) return

    const queue = [...offlineQueue]
    setOfflineQueue([])

    for (const item of queue) {
      try {
        if (item.type === 'progress') {
          const progressData = item.data as Partial<WordProgress>
          await supabase
            .from('user_progress')
            .upsert(progressData, { onConflict: 'user_id,word_id' })
        }
      } catch (queueError) {
        console.error('Error processing offline queue:', queueError)
        setOfflineQueue(prev => [...prev, item])
      }
    }
  }, [isOnline, offlineQueue])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      setIsOnline(true)
      setError(null)
      if (offlineQueue.length > 0) {
        processOfflineQueue()
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setError('You are currently offline. Changes will be synced when connection is restored.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [offlineQueue.length, processOfflineQueue])

  const startSession = useCallback(
    async (learningDirection: 'ru-it' | 'it-ru') => {
      if (!user) return null

      try {
        const { data, error: supabaseError } = await supabase
          .from('learning_sessions')
          .insert({
            user_id: user.id,
            learning_direction: learningDirection,
            started_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (supabaseError) throw supabaseError

        setCurrentSession(data.id)
        setSessionStats({ wordsStudied: 0, correctAnswers: 0 })
        return data.id
      } catch (sessionError) {
        console.error('Error starting session:', sessionError)
        return null
      }
    },
    [user],
  )

  const endSession = useCallback(async () => {
    if (!currentSession || !user) return

    try {
      const { error: supabaseError } = await supabase
        .from('learning_sessions')
        .update({
          ended_at: new Date().toISOString(),
          words_studied: sessionStats.wordsStudied,
          correct_answers: sessionStats.correctAnswers,
        })
        .eq('id', currentSession)

      if (supabaseError) throw supabaseError

      setCurrentSession(null)
      setSessionStats({ wordsStudied: 0, correctAnswers: 0 })
    } catch (sessionError) {
      console.error('Error ending session:', sessionError)
    }
  }, [currentSession, sessionStats, user])

  const updateProgress = useCallback(
    async (wordId: number, correct: boolean) => {
      if (!user) return

      const currentProgress = progress.get(wordId)
      const newCorrectCount = currentProgress
        ? correct
          ? currentProgress.correct_count + 1
          : currentProgress.correct_count
        : correct
          ? 1
          : 0

      const newWrongCount = currentProgress
        ? !correct
          ? currentProgress.wrong_count + 1
          : currentProgress.wrong_count
        : !correct
          ? 1
          : 0

      const masteryLevel = calculateMasteryLevel(newCorrectCount, newWrongCount)

      const updatedProgress: Partial<WordProgress> = {
        id: currentProgress?.id,
        user_id: user.id,
        word_id: wordId,
        correct_count: newCorrectCount,
        wrong_count: newWrongCount,
        mastery_level: masteryLevel,
        last_practiced: new Date().toISOString(),
      }

      setProgress(prev => {
        const next = new Map(prev)
        next.set(wordId, { ...(next.get(wordId) ?? ({} as WordProgress)), ...updatedProgress } as WordProgress)
        return next
      })

      setSessionStats(prev => ({
        wordsStudied: prev.wordsStudied + 1,
        correctAnswers: prev.correctAnswers + (correct ? 1 : 0),
      }))

      if (!isOnline) {
        setOfflineQueue(prev => [...prev, { type: 'progress', data: updatedProgress }])
        return
      }

      try {
        setError(null)
        const { data, error: supabaseError } = await supabase
          .from('user_progress')
          .upsert(updatedProgress, {
            onConflict: 'user_id,word_id',
          })
          .select()
          .single()

        if (supabaseError) throw supabaseError

        setProgress(prev => {
          const next = new Map(prev)
          next.set(wordId, data)
          return next
        })
      } catch (updateError) {
        const errorMessage = updateError instanceof Error ? updateError.message : 'Failed to update progress'
        console.error('Error updating progress:', updateError)
        setError(errorMessage)
        setOfflineQueue(prev => [...prev, { type: 'progress', data: updatedProgress }])
      }
    },
    [user, progress, isOnline],
  )

  const getStats = useCallback((): ProgressStats => {
    const progressArray = Array.from(progress.values())

    const totalWordsStudied = progressArray.length
    const totalAttempts = progressArray.reduce((sum, p) => sum + p.correct_count + p.wrong_count, 0)
    const correctAnswers = progressArray.reduce((sum, p) => sum + p.correct_count, 0)
    const accuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0

    const recentProgress = progressArray
      .slice()
      .sort((a, b) => new Date(b.last_practiced).getTime() - new Date(a.last_practiced).getTime())
      .slice(0, 10)

    let currentStreak = 0
    for (const item of recentProgress) {
      if (item.correct_count > item.wrong_count) {
        currentStreak++
      } else {
        break
      }
    }

    const masteredWords = progressArray.filter(item => item.mastery_level >= 4).length
    const wordsInProgress = progressArray.filter(item => item.mastery_level > 0 && item.mastery_level < 4).length

    return {
      totalWordsStudied,
      totalAttempts,
      correctAnswers,
      accuracy,
      currentStreak,
      longestStreak: currentStreak,
      masteredWords,
      wordsInProgress,
    }
  }, [progress])

  const getDueWords = useCallback(
    (allWords: number[]): number[] => {
      return getDueWordsUtil(allWords, progress)
    },
    [progress],
  )

  const contextValue = useMemo<ProgressContextValue>(
    () => ({
      progress,
      loading,
      error,
      isOnline,
      currentSession,
      sessionStats,
      loadProgress,
      updateProgress,
      startSession,
      endSession,
      getStats,
      getDueWords,
      refreshProgress: loadProgress,
      hasOfflineChanges: offlineQueue.length > 0,
    }),
    [
      currentSession,
      endSession,
      error,
      getDueWords,
      getStats,
      isOnline,
      loadProgress,
      offlineQueue.length,
      progress,
      sessionStats,
      startSession,
      updateProgress,
      loading,
    ],
  )

  return contextValue
}

export const ProgressProvider = ({ children }: { children: ReactNode }) => {
  const value = useProvideProgress()
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export const useProgress = (): ProgressContextValue => {
  const context = useContext(ProgressContext)
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider')
  }
  return context
}
