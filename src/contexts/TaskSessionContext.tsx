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

interface TaskSessionSnapshot {
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

export const TaskSessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<TaskSessionSnapshot | null>(null)

  const saveSession = useCallback((snapshot: TaskSessionSnapshot) => {
    setSession(prev => {
      if (
        prev &&
        prev.id === snapshot.id &&
        prev.status === snapshot.status &&
        prev.learningDirection === snapshot.learningDirection &&
        prev.state.currentWordIndex === snapshot.state.currentWordIndex &&
        prev.state.userInput === snapshot.state.userInput &&
        prev.state.showAnswer === snapshot.state.showAnswer &&
        prev.state.learningDirection === snapshot.state.learningDirection &&
        prev.state.darkMode === snapshot.state.darkMode &&
        prev.state.shuffleMode === snapshot.state.shuffleMode &&
        prev.state.accentSensitive === snapshot.state.accentSensitive &&
        prev.words === snapshot.words &&
        prev.selectedCategories === snapshot.selectedCategories &&
        prev.isCorrect === snapshot.isCorrect &&
        prev.responseTimeMs === snapshot.responseTimeMs &&
        prev.difficultyRating === snapshot.difficultyRating
      ) {
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
