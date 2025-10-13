import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ModeSelection } from '../components/ModeSelection'
import { Header } from '../components/Header'
import { FlashCard } from '../components/FlashCard'
import { ProgressBar } from '../components/ProgressBar'
import { Statistics } from '../components/Statistics'
import { UserProfile } from '../components/auth/UserProfile'
import { useKeyboard } from '../hooks/useKeyboard'
import { useProgress } from '../hooks/useProgress'
import { useAuth } from '../contexts/AuthContext'
import { WORDS, getShuffledWords } from '../data/words'
import { AppState, LearningDirection, Word } from '../types'

/**
 * Dashboard Page
 *
 * Main application page for authenticated users.
 * Contains the flashcard learning interface with:
 * - Mode selection (Russian→Italian or Italian→Russian)
 * - Flashcard interface
 * - Progress tracking
 * - Dark mode, shuffle, and other settings
 */
export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const {
    progress: dbProgress,
    loading: progressLoading,
    updateProgress,
    startSession,
    endSession,
    currentSession,
  } = useProgress()

  const [hasSelectedMode, setHasSelectedMode] = useState(false)
  const [words, setWords] = useState<Word[]>(WORDS)
  const [state, setState] = useState<AppState>({
    currentWordIndex: 0,
    userInput: '',
    showAnswer: false,
    learningDirection: 'ru-it',
    darkMode: false,
    shuffleMode: false,
  })

  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setState(prev => ({ ...prev, darkMode: savedDarkMode }))
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const currentWord = words[state.currentWordIndex]

  const handleModeSelect = async (direction: LearningDirection) => {
    setState(prev => ({ ...prev, learningDirection: direction }))
    // Start a new learning session in the database
    await startSession(direction)
    setHasSelectedMode(true)
  }

  const handleNext = () => {
    if (state.currentWordIndex < words.length - 1) {
      setState(prev => ({
        ...prev,
        currentWordIndex: prev.currentWordIndex + 1,
        userInput: '',
        showAnswer: false,
      }))
      setIsCorrect(null)
    }
  }

  const handlePrevious = () => {
    if (state.currentWordIndex > 0) {
      setState(prev => ({
        ...prev,
        currentWordIndex: prev.currentWordIndex - 1,
        userInput: '',
        showAnswer: false,
      }))
      setIsCorrect(null)
    }
  }

  const handleSubmit = async () => {
    if (!state.userInput.trim() || state.showAnswer) return

    const targetWord = state.learningDirection === 'ru-it'
      ? currentWord.italian.toLowerCase()
      : currentWord.russian.toLowerCase()

    const userAnswer = state.userInput.toLowerCase().trim()
    const correct = userAnswer === targetWord

    setIsCorrect(correct)

    // Update progress in database
    await updateProgress(currentWord.id, correct)

    setState(prev => ({
      ...prev,
      showAnswer: true,
    }))
  }

  const handleToggleDarkMode = () => {
    setState(prev => ({ ...prev, darkMode: !prev.darkMode }))
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('darkMode', (!state.darkMode).toString())
  }

  const handleToggleDirection = () => {
    setState(prev => ({
      ...prev,
      learningDirection: prev.learningDirection === 'ru-it' ? 'it-ru' : 'ru-it',
      userInput: '',
      showAnswer: false,
    }))
    setIsCorrect(null)
  }

  const handleToggleShuffle = () => {
    const newShuffleMode = !state.shuffleMode
    setState(prev => ({ ...prev, shuffleMode: newShuffleMode }))

    if (newShuffleMode) {
      setWords(getShuffledWords())
    } else {
      setWords(WORDS)
    }

    setState(prev => ({
      ...prev,
      currentWordIndex: 0,
      userInput: '',
      showAnswer: false,
    }))
    setIsCorrect(null)
  }

  const handleRestart = async () => {
    // End current session
    if (currentSession) {
      await endSession()
    }

    setState(prev => ({
      ...prev,
      currentWordIndex: 0,
      userInput: '',
      showAnswer: false,
    }))
    setIsCorrect(null)
    setHasSelectedMode(false)

    if (state.shuffleMode) {
      setWords(getShuffledWords())
    }
  }

  const handleInputChange = (value: string) => {
    setState(prev => ({ ...prev, userInput: value }))
  }

  useKeyboard({
    onNext: handleNext,
    onPrevious: handlePrevious,
    onSubmit: handleSubmit,
    onToggleMode: handleToggleDirection,
    onRestart: handleRestart,
    onShuffle: handleToggleShuffle,
  })

  if (progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your progress...</p>
        </div>
      </div>
    )
  }

  const currentWordProgress = dbProgress.get(currentWord?.id)

  return (
    <div data-testid="protected-content">
      {!hasSelectedMode ? (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-8">
          {/* Dashboard Header with UserProfile */}
          <div className="flex justify-end items-center p-6">
            <UserProfile />
          </div>

          <div className="container mx-auto px-6">
            {/* User Stats Section */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Welcome back, {user?.email}!
                </h1>
                <Statistics />
              </div>
            </div>

            {/* Mode Selection */}
            <ModeSelection onModeSelect={handleModeSelect} />
          </div>
        </div>
      ) : (
        <div className={`min-h-screen transition-colors duration-300 ${
          state.darkMode ? 'dark' : ''
        }`}>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
            <Header
              darkMode={state.darkMode}
              shuffleMode={state.shuffleMode}
              learningDirection={state.learningDirection}
              onToggleDarkMode={handleToggleDarkMode}
              onToggleShuffle={handleToggleShuffle}
              onToggleDirection={handleToggleDirection}
              onRestart={handleRestart}
            />

            <div className="container mx-auto px-6 py-8" data-testid="flashcard-app">
              {currentSession && (
                <div className="mb-4 flex justify-center">
                  <span
                    className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                    data-testid="session-active"
                  >
                    Active session · {state.learningDirection === 'ru-it' ? 'Italian from Russian' : 'Russian from Italian'}
                  </span>
                </div>
              )}

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Progress Sidebar */}
                <div className="lg:col-span-1">
                  <ProgressBar
                    totalWords={words.length}
                    currentIndex={state.currentWordIndex}
                  />
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={state.currentWordIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <FlashCard
                        word={currentWord}
                        learningDirection={state.learningDirection}
                        userInput={state.userInput}
                        showAnswer={state.showAnswer}
                        onInputChange={handleInputChange}
                        onSubmit={handleSubmit}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        isCorrect={isCorrect}
                        currentIndex={state.currentWordIndex}
                        totalWords={words.length}
                        wordProgress={currentWordProgress}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
