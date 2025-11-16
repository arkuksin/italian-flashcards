import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react'
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
import { Container } from '../components/layout'
import { useKeyboard } from '../hooks/useKeyboard'
import { useProgress } from '../hooks/useProgress'
import { useGamification } from '../hooks/useGamification'
import { useAuth } from '../contexts/AuthContext'
import { useTaskSession } from '../contexts/TaskSessionContext'
import { WORDS, getShuffledWords } from '../data/words'
import { wordService } from '../services/wordService'
import { AppState, LearningDirection, Word, DifficultyRating } from '../types'
import { TaskModeAppBar } from '../components/TaskModeAppBar'
import { ConfirmLeaveDialog } from '../components/ConfirmLeaveDialog'
import { useConfirmNavigation } from '../hooks/useConfirmNavigation'

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
  const { session, saveSession, clearSession } = useTaskSession()
  const {
    progress: dbProgress,
    loading: progressLoading,
    updateProgress,
    startSession,
    endSession,
    currentSession,
  } = useProgress()
  const { updateDailyProgress } = useGamification()

  const [hasSelectedMode, setHasSelectedMode] = useState(() => session?.status === 'active')
  const [words, setWords] = useState<Word[]>(() => session?.words ?? WORDS)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => session?.selectedCategories ?? [])
  const [state, setState] = useState<AppState>(() =>
    session?.state ?? {
      currentWordIndex: 0,
      userInput: '',
      showAnswer: false,
      learningDirection: 'ru-it',
      darkMode: false,
      shuffleMode: false,
      accentSensitive: true,
    },
  )

  const [isCorrect, setIsCorrect] = useState<boolean | null>(session?.isCorrect ?? null)
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [responseTimeMs, setResponseTimeMs] = useState<number | undefined>(session?.responseTimeMs)
  const [difficultyRating, setDifficultyRating] = useState<DifficultyRating | undefined>(session?.difficultyRating)
  const [sessionId, setSessionId] = useState<string | null>(session?.id ?? null)
  const [isSaving, setIsSaving] = useState(false)
  const [showStatistics, setShowStatistics] = useState(true)
  const [showGamification, setShowGamification] = useState(true)
  const [showLeitner, setShowLeitner] = useState(true)
  const ensureSessionId = useCallback(() => {
    if (sessionId) return sessionId
    const generatedId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)
    setSessionId(generatedId)
    return generatedId
  }, [sessionId])

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

  useEffect(() => {
    if (!session) {
      if (!hasSelectedMode) {
        setSessionId(null)
      }
      return
    }

    if (!hasSelectedMode && session.status === 'active') {
      setState(session.state)
      setWords(session.words)
      setSelectedCategories(session.selectedCategories)
      setIsCorrect(session.isCorrect)
      setResponseTimeMs(session.responseTimeMs)
      setDifficultyRating(session.difficultyRating)
      setSessionId(session.id)
      setHasSelectedMode(true)
      setQuestionStartTime(Date.now())

      if (session.state.darkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } else if (!hasSelectedMode && session.status === 'suspended') {
      setSessionId(session.id)
    }
  }, [hasSelectedMode, session])

  const currentWord = words[state.currentWordIndex]

  useEffect(() => {
    if (!hasSelectedMode) return

    const id = ensureSessionId()

    saveSession({
      id,
      status: 'active',
      learningDirection: state.learningDirection,
      state,
      words,
      selectedCategories,
      isCorrect,
      responseTimeMs,
      difficultyRating,
      updatedAt: Date.now(),
    })
  }, [
    difficultyRating,
    hasSelectedMode,
    isCorrect,
    responseTimeMs,
    saveSession,
    selectedCategories,
    ensureSessionId,
    state,
    words,
  ])

  const handleModeSelect = async (direction: LearningDirection, categories?: string[]) => {
    const newSessionId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)

    setSessionId(newSessionId)
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
    setIsCorrect(null)
    setResponseTimeMs(undefined)
    setDifficultyRating(undefined)
    setQuestionStartTime(Date.now())
  }

  const savePendingProgress = useCallback(async () => {
    if (!currentWord) return

    if (!(state.showAnswer && difficultyRating === undefined && isCorrect !== null)) {
      return
    }

    setIsSaving(true)
    try {
      await updateProgress(currentWord.id, isCorrect, responseTimeMs, undefined)
      await updateDailyProgress(isCorrect)
    } catch (error) {
      console.error('Error saving progress:', error)
    } finally {
      setIsSaving(false)
    }
  }, [
    currentWord,
    difficultyRating,
    isCorrect,
    responseTimeMs,
    state.showAnswer,
    updateDailyProgress,
    updateProgress,
  ])

  const hasUnsavedProgress =
    (state.showAnswer && difficultyRating === undefined && isCorrect !== null) ||
    (!state.showAnswer && state.userInput.trim().length > 0)

  const {
    isDialogOpen,
    pendingNavigation,
    requestNavigation,
    cancelNavigation,
    confirmNavigation,
    discardNavigation,
  } = useConfirmNavigation({
    when: hasUnsavedProgress,
    beforeUnloadMessage: 'Du hast ungesicherte Antworten. Möchtest du wirklich wechseln?',
  })

  const handleNext = async () => {
    // Save progress in background without blocking UI navigation
    savePendingProgress()

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
    // Save progress in background without blocking UI navigation
    savePendingProgress()

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
    await savePendingProgress()

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
    await savePendingProgress()

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
    setSessionId(null)
    clearSession()

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

  const handleBackToModeSelection = useCallback(() => {
    requestNavigation({
      context: 'mode-selection',
      onProceed: async () => {
        await savePendingProgress()
        const id = ensureSessionId()
        saveSession({
          id,
          status: 'suspended',
          learningDirection: state.learningDirection,
          state,
          words,
          selectedCategories,
          isCorrect,
          responseTimeMs,
          difficultyRating,
          updatedAt: Date.now(),
        })
        setHasSelectedMode(false)
      },
      onDiscard: async () => {
        setState(prev => ({
          ...prev,
          userInput: '',
          showAnswer: false,
        }))
        setIsCorrect(null)
        setResponseTimeMs(undefined)
        setDifficultyRating(undefined)
        setHasSelectedMode(false)
        setSessionId(null)
        clearSession()
      },
    })
  }, [
    clearSession,
    difficultyRating,
    ensureSessionId,
    isCorrect,
    requestNavigation,
    responseTimeMs,
    savePendingProgress,
    saveSession,
    selectedCategories,
    state,
    words,
  ])

  const handleOpenAnalysis = useCallback(() => {
    requestNavigation({
      context: 'analytics',
      onProceed: async () => {
        await savePendingProgress()
        const id = ensureSessionId()
        saveSession({
          id,
          status: 'active',
          learningDirection: state.learningDirection,
          state,
          words,
          selectedCategories,
          isCorrect,
          responseTimeMs,
          difficultyRating,
          updatedAt: Date.now(),
        })
        navigate('/analytics')
      },
      onDiscard: async () => {
        const id = ensureSessionId()
        saveSession({
          id,
          status: 'active',
          learningDirection: state.learningDirection,
          state,
          words,
          selectedCategories,
          isCorrect,
          responseTimeMs,
          difficultyRating,
          updatedAt: Date.now(),
        })
        navigate('/analytics')
      },
    })
  }, [
    difficultyRating,
    ensureSessionId,
    isCorrect,
    navigate,
    requestNavigation,
    responseTimeMs,
    savePendingProgress,
    saveSession,
    selectedCategories,
    state,
    words,
  ])

  const resumeSession = useCallback(() => {
    if (!session) return

    setState(session.state)
    setWords(session.words)
    setSelectedCategories(session.selectedCategories)
    setIsCorrect(session.isCorrect)
    setResponseTimeMs(session.responseTimeMs)
    setDifficultyRating(session.difficultyRating)
    setSessionId(session.id)
    setHasSelectedMode(true)
    setQuestionStartTime(Date.now())

    if (session.state.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [session])

  useEffect(() => {
    if (!hasSelectedMode) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleBackToModeSelection()
      }
      if (event.altKey && (event.key === 'a' || event.key === 'A')) {
        event.preventDefault()
        handleOpenAnalysis()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleBackToModeSelection, handleOpenAnalysis, hasSelectedMode])

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
  const resolvedCount = Math.min(words.length, state.currentWordIndex + (state.showAnswer ? 1 : 0))
  const progressPercent = words.length === 0 ? 0 : (resolvedCount / words.length) * 100
  const destinationLabelMap: Record<string, string> = {
    'mode-selection': 'die Modus-Auswahl',
    analytics: 'die Analyse',
    dashboard: 'das Dashboard',
    external: 'den Zielbereich',
  }
  const destinationLabel = pendingNavigation ? destinationLabelMap[pendingNavigation.context] ?? 'den Zielbereich' : undefined
  const breadcrumbs = [
    'Dashboard',
    'Aufgabenmodus',
    state.learningDirection === 'ru-it' ? 'Russisch → Italienisch' : 'Italienisch → Russisch',
  ]
  if (selectedCategories.length > 0) {
    breadcrumbs.push(`Kategorien (${selectedCategories.length})`)
  }

  return (
    <main id="main-content" data-testid="protected-content">
      {!hasSelectedMode ? (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-8">
          {/* Dashboard Header with UserProfile */}
          <div className="flex justify-between items-center p-6">
            <button
              onClick={() => navigate('/analytics')}
              className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 rounded-lg shadow-sm transition-all text-sm"
              data-testid="analytics-button"
            >
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-gray-700 dark:text-gray-200">Analytics</span>
            </button>
            <UserProfile />
          </div>

          <Container width="dashboard" className="py-2">
            {/* PRIMARY ACTION: Mode Selection + Category Filter - Enhanced Visual Weight */}
            <motion.section
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mb-16 space-y-8"
            >
              {/* Enhanced Mode Selection with Glow Effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-xl opacity-20 dark:opacity-30"></div>
                <div className="relative">
                  <ModeSelection onModeSelect={handleModeSelect} selectedCategories={selectedCategories} />
                </div>
              </div>

              {/* Category Filter with Reduced Visual Weight */}
              {user && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="bg-white/70 dark:bg-gray-800/70 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5"
                >
                  <CategoryFilter userId={user.id} onSelectionChange={setSelectedCategories} />
                </motion.div>
              )}
            </motion.section>

            {/* Resume Session Card */}
            {session && session.status === 'suspended' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-12"
              >
                <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 shadow-lg dark:border-blue-800/40">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                        Unvollendete Aufgabe
                      </p>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Setze deine Aufgabe fort</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Fortschritt:{' '}
                        {Math.min(session.state.currentWordIndex + (session.state.showAnswer ? 1 : 0), session.words.length)}
                        /{session.words.length} Karten · Richtung{' '}
                        {session.learningDirection === 'ru-it' ? 'Russisch → Italienisch' : 'Italienisch → Russisch'}
                      </p>
                    </div>
                    <button
                      onClick={resumeSession}
                      className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      Fortsetzen
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Stats - Reduced Visual Weight */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mb-6"
            >
              <QuickStats />
            </motion.div>

            {/* SECONDARY CONTENT: Collapsible Sections with Clear Headers */}

            {/* Detailed Statistics Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="mb-6"
            >
              <button
                onClick={() => setShowStatistics(!showStatistics)}
                className="w-full flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 rounded-lg border border-gray-200/50 dark:border-gray-700/50 transition-all mb-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                  <div className="text-left">
                    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                      Detaillierte Statistiken
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Lernfortschritt und Leistungsanalyse
                    </p>
                  </div>
                </div>
                {showStatistics ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              <AnimatePresence>
                {showStatistics && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-700/50 p-5">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('welcome', { name: user?.email?.split('@')[0] || '' })}
                      </h3>
                      <Statistics />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Gamification Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="mb-6"
            >
              <button
                onClick={() => setShowGamification(!showGamification)}
                className="w-full flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 rounded-lg border border-gray-200/50 dark:border-gray-700/50 transition-all mb-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
                  <div className="text-left">
                    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                      Erfolge & Fortschritt
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Streaks, XP, Ziele und Auszeichnungen
                    </p>
                  </div>
                </div>
                {showGamification ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              <AnimatePresence>
                {showGamification && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DailyStreakWidget />
                        <XPProgressBar />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DailyGoalProgress />
                        <AchievementBadges maxDisplay={3} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Leitner Box Visualizer Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="mb-8"
            >
              <button
                onClick={() => setShowLeitner(!showLeitner)}
                className="w-full flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 rounded-lg border border-gray-200/50 dark:border-gray-700/50 transition-all mb-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                  <div className="text-left">
                    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                      Leitner System
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Visualisierung deiner Lernboxen
                    </p>
                  </div>
                </div>
                {showLeitner ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              <AnimatePresence>
                {showLeitner && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <LeitnerBoxVisualizer />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </Container>
        </div>
      ) : (
        <div className={`min-h-screen transition-colors duration-300 ${
          state.darkMode ? 'dark' : ''
        }`}>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
            <TaskModeAppBar
              onBackToModes={handleBackToModeSelection}
              onOpenAnalysis={handleOpenAnalysis}
              progressPercent={progressPercent}
              resolvedCount={resolvedCount}
              totalCount={words.length}
              isSaving={isSaving}
              breadcrumbs={breadcrumbs}
            />
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

            <Container width="dashboard" className="py-8" data-testid="flashcard-app">
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
            </Container>
          </div>
        </div>
      )}
      <ConfirmLeaveDialog
        open={isDialogOpen}
        onClose={cancelNavigation}
        onConfirmSave={() => {
          void confirmNavigation()
        }}
        onConfirmDiscard={() => {
          void discardNavigation()
        }}
        isSaving={isSaving}
        destinationLabel={destinationLabel}
      />
    </main>
  )
}
