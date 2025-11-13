import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AppState, DifficultyRating, LearningDirection, Word } from '../types'

type TaskSessionStatus = 'active' | 'suspended'

export interface TaskSessionSnapshot {
  id: string
  status: TaskSessionStatus
  learningDirection: LearningDirection
  state: AppState
  words: Word[]
  selectedCategories: string[]
  isCorrect: boolean | null
  responseTimeMs?: number
  difficultyRating?: DifficultyRating
  updatedAt: number
}

interface TaskSessionContextValue {
  session: TaskSessionSnapshot | null
  saveSession: (snapshot: TaskSessionSnapshot) => void
  clearSession: () => void
}

const TaskSessionContext = createContext<TaskSessionContextValue | undefined>(undefined)

const areSessionsEqual = (
  prev: TaskSessionSnapshot | null,
  next: TaskSessionSnapshot,
): boolean => {
  if (!prev) return false
  return (
    prev.id === next.id &&
    prev.status === next.status &&
    prev.learningDirection === next.learningDirection &&
    prev.state.currentWordIndex === next.state.currentWordIndex &&
    prev.state.userInput === next.state.userInput &&
    prev.state.showAnswer === next.state.showAnswer &&
    prev.state.learningDirection === next.state.learningDirection &&
    prev.state.darkMode === next.state.darkMode &&
    prev.state.shuffleMode === next.state.shuffleMode &&
    prev.state.accentSensitive === next.state.accentSensitive &&
    prev.words === next.words &&
    prev.selectedCategories === next.selectedCategories &&
    prev.isCorrect === next.isCorrect &&
    prev.responseTimeMs === next.responseTimeMs &&
    prev.difficultyRating === next.difficultyRating
  )
}

export const TaskSessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<TaskSessionSnapshot | null>(null)

  const saveSession = useCallback((snapshot: TaskSessionSnapshot) => {
    setSession(prev => {
      if (areSessionsEqual(prev, snapshot)) {
        return prev
      }
      return snapshot
    })
  }, [])

  const clearSession = useCallback(() => {
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      saveSession,
      clearSession,
    }),
    [session, saveSession, clearSession],
  )

  return <TaskSessionContext.Provider value={value}>{children}</TaskSessionContext.Provider>
}

export const useTaskSession = (): TaskSessionContextValue => {
  const context = useContext(TaskSessionContext)
  if (!context) {
    throw new Error('useTaskSession must be used within a TaskSessionProvider')
  }
  return context
}
