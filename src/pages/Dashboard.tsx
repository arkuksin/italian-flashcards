import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart3 } from 'lucide-react'
import { ModeSelection } from '../components/ModeSelection'
import { CategoryFilter } from '../components/CategoryFilter'
import { QuickStats } from '../components/QuickStats'
import { Header } from '../components/Header'
import { FlashCard } from '../components/FlashCard'
import { ProgressBar } from '../components/ProgressBar'
import { Statistics } from '../components/Statistics'
import { LeitnerBoxVisualizer } from '../components/LeitnerBoxVisualizer'
import { UserProfile } from '../components/auth/UserProfile'
import { DailyStreakWidget } from '../components/DailyStreakWidget'
import { XPProgressBar } from '../components/XPProgressBar'
import { AchievementBadges } from '../components/AchievementBadges'
import { DailyGoalProgress } from '../components/DailyGoalProgress'
import { useKeyboard } from '../hooks/useKeyboard'
import { useProgress } from '../hooks/useProgress'
import { useGamification } from '../hooks/useGamification'
import { useAuth } from '../contexts/AuthContext'
import { WORDS, getShuffledWords } from '../data/words'
import { wordService } from '../services/wordService'
import { AppState, LearningDirection, Word, DifficultyRating } from '../types'

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
  const { t } = useTranslation('dashboard')
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    progress: dbProgress,
    loading: progressLoading,
    updateProgress,
    startSession,
    endSession,
    currentSession,
  } = useProgress()
  const { updateDailyProgress } = useGamification()

  const [hasSelectedMode, setHasSelectedMode] = useState(false)
  const [words, setWords] = useState<Word[]>(WORDS)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [state, setState] = useState<AppState>({
    currentWordIndex: 0,
    userInput: '',
    showAnswer: false,
    learningDirection: 'ru-it',
    darkMode: false,
    shuffleMode: false,
    accentSensitive: true,
  })

  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [responseTimeMs, setResponseTimeMs] = useState<number | undefined>(undefined)
  const [difficultyRating, setDifficultyRating] = useState<DifficultyRating | undefined>(undefined)

  // Initialize persisted preferences from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    const savedAccentSensitivity = localStorage.getItem('accentSensitive')

    setState(prev => {
      const nextState = { ...prev }

      if (savedDarkMode !== null) {
        const isDarkMode = savedDarkMode === 'true'
        nextState.darkMode = isDarkMode
        if (isDarkMode) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }

      if (savedAccentSensitivity !== null) {
        nextState.accentSensitive = savedAccentSensitivity === 'true'
      }

      return nextState
    })
  }, [])

  const currentWord = words[state.currentWordIndex]

  const handleModeSelect = async (direction: LearningDirection, categories?: string[]) => {
    setState(prev => ({ ...prev, learningDirection: direction }))

    // If categories are selected, filter words by categories
    if (categories && categories.length > 0) {
      try {
        const allWords = await wordService.getAllWords()
        const filteredWords = allWords.filter(word => categories.includes(word.category))

        // Shuffle if shuffle mode is on
        const wordsToUse = state.shuffleMode
          ? [...filteredWords].sort(() => Math.random() - 0.5)
          : filteredWords

        setWords(wordsToUse)
        setSelectedCategories(categories)
      } catch (error) {
        console.error('Error loading filtered words:', error)
        // Fallback to all words if there's an error
        setWords(WORDS)
      }
    } else {
      // No filter, use all words
      setWords(state.shuffleMode ? getShuffledWords() : WORDS)
      setSelectedCategories([])
    }

    // Start a new learning session in the database
    await startSession(direction)
    setHasSelectedMode(true)
  }

  const handleNext = async () => {
    // Auto-save progress if answer was shown but no difficulty rating was given
    if (state.showAnswer && difficultyRating === undefined && isCorrect !== null) {
      await updateProgress(currentWord.id, isCorrect, responseTimeMs, undefined)
      await updateDailyProgress(isCorrect)
    }

    if (state.currentWordIndex < words.length - 1) {
      setState(prev => ({
        ...prev,
        currentWordIndex: prev.currentWordIndex + 1,
        userInput: '',
        showAnswer: false,
      }))
      setIsCorrect(null)
      setQuestionStartTime(Date.now())
      setResponseTimeMs(undefined)
      setDifficultyRating(undefined)
    }
  }

  const handlePrevious = async () => {
    // Auto-save progress if answer was shown but no difficulty rating was given
    if (state.showAnswer && difficultyRating === undefined && isCorrect !== null) {
      await updateProgress(currentWord.id, isCorrect, responseTimeMs, undefined)
      await updateDailyProgress(isCorrect)
    }

    if (state.currentWordIndex > 0) {
      setState(prev => ({
        ...prev,
        currentWordIndex: prev.currentWordIndex - 1,
        userInput: '',
        showAnswer: false,
      }))
      setIsCorrect(null)
      setQuestionStartTime(Date.now())
      setResponseTimeMs(undefined)
      setDifficultyRating(undefined)
    }
  }

  const stripDiacritics = (value: string) =>
    value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const handleSubmit = async () => {
    if (!state.userInput.trim() || state.showAnswer) return

    // Calculate response time
    const responseTime = Date.now() - questionStartTime
    setResponseTimeMs(responseTime)

    let targetWord = state.learningDirection === 'ru-it'
      ? currentWord.italian.toLowerCase()
      : currentWord.russian.toLowerCase()

    let userAnswer = state.userInput.toLowerCase().trim()

    if (!state.accentSensitive && state.learningDirection === 'ru-it') {
      targetWord = stripDiacritics(targetWord)
      userAnswer = stripDiacritics(userAnswer)
    }
    const correct = userAnswer === targetWord

    setIsCorrect(correct)

    setState(prev => ({
      ...prev,
      showAnswer: true,
    }))
  }

  const handleDifficultyRating = async (rating: DifficultyRating) => {
    setDifficultyRating(rating)

    // Update progress in database with response time and difficulty rating
    await updateProgress(currentWord.id, isCorrect ?? false, responseTimeMs, rating)

    // Update gamification (XP, streaks, achievements)
    await updateDailyProgress(isCorrect ?? false)
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

  const handleToggleShuffle = async () => {
    const newShuffleMode = !state.shuffleMode
    setState(prev => ({ ...prev, shuffleMode: newShuffleMode }))

    // Apply category filter if categories are selected
    if (selectedCategories.length > 0) {
      try {
        const allWords = await wordService.getAllWords()
        const filteredWords = allWords.filter(word => selectedCategories.includes(word.category))
        const wordsToUse = newShuffleMode
          ? [...filteredWords].sort(() => Math.random() - 0.5)
          : filteredWords
        setWords(wordsToUse)
      } catch (error) {
        console.error('Error toggling shuffle with category filter:', error)
        // Fallback
        if (newShuffleMode) {
          setWords(getShuffledWords())
        } else {
          setWords(WORDS)
        }
      }
    } else {
      // No category filter
      if (newShuffleMode) {
        setWords(getShuffledWords())
      } else {
        setWords(WORDS)
      }
    }

    setState(prev => ({
      ...prev,
      currentWordIndex: 0,
      userInput: '',
      showAnswer: false,
    }))
    setIsCorrect(null)
  }

  const handleToggleAccentSensitivity = () => {
    setState(prev => {
      const nextAccentSensitivity = !prev.accentSensitive
      localStorage.setItem('accentSensitive', nextAccentSensitivity.toString())
      return {
        ...prev,
        accentSensitive: nextAccentSensitivity,
      }
    })
  }

  const handleRestart = async () => {
    // Auto-save progress if answer was shown but no difficulty rating was given
    if (state.showAnswer && difficultyRating === undefined && isCorrect !== null) {
      await updateProgress(currentWord.id, isCorrect, responseTimeMs, undefined)
      await updateDailyProgress(isCorrect)
    }

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
    setQuestionStartTime(Date.now())
    setResponseTimeMs(undefined)
    setDifficultyRating(undefined)
    setHasSelectedMode(false)
    setSelectedCategories([])

    // Reset to all words
    if (state.shuffleMode) {
      setWords(getShuffledWords())
    } else {
      setWords(WORDS)
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
    onToggleAccent: handleToggleAccentSensitivity,
  })

  if (progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{t('loading')}</p>
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
          <div className="flex justify-between items-center p-6">
            <button
              onClick={() => navigate('/analytics')}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg shadow-md transition-colors"
              data-testid="analytics-button"
            >
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-gray-900 dark:text-white">Analytics</span>
            </button>
            <UserProfile />
          </div>

          <div className="container mx-auto px-6">
            {/* Mode Selection + Category Filter - Above the Fold */}
            <section className="max-w-4xl mx-auto mb-8 space-y-6">
              {/* Mode Selection */}
              <ModeSelection onModeSelect={handleModeSelect} />

              {/* Category Filter */}
              {user && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <CategoryFilter
                    userId={user.id}
                    onSelectionChange={setSelectedCategories}
                  />
                </div>
              )}
            </section>

            {/* Quick Stats - Compact Overview */}
            <div className="max-w-4xl mx-auto mb-8">
              <QuickStats />
            </div>

            {/* Welcome Message and Detailed Stats */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {t('welcome', { name: user?.email?.split('@')[0] || '' })}
                </h1>
                <Statistics />
              </div>
            </div>

            {/* Phase 5: Gamification Section */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <DailyStreakWidget />
                <XPProgressBar />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DailyGoalProgress />
                <AchievementBadges maxDisplay={3} />
              </div>
            </div>

            {/* Phase 2: Leitner Box Visualizer */}
            <div className="max-w-4xl mx-auto mb-8">
              <LeitnerBoxVisualizer />
            </div>
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
              accentSensitive={state.accentSensitive}
              onToggleDarkMode={handleToggleDarkMode}
              onToggleShuffle={handleToggleShuffle}
              onToggleDirection={handleToggleDirection}
              onToggleAccent={handleToggleAccentSensitivity}
              onRestart={handleRestart}
            />

            <div className="container mx-auto px-6 py-8" data-testid="flashcard-app">
              {currentSession && (
                <div className="mb-4 flex justify-center">
                  <span
                    className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                    data-testid="session-active"
                  >
                    {t('session.active')} · {state.learningDirection === 'ru-it' ? t('session.ruToIt') : t('session.itToRu')}
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
                        onDifficultyRating={handleDifficultyRating}
                        difficultyRating={difficultyRating}
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
