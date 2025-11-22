import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Star, Volume2, Check, BookOpen, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { UserProfile } from '../components/auth/UserProfile'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { Container } from '../components/layout'
import { Card } from '../components/ui/Card'
import { wordOfTheDayService } from '../services/wordOfTheDayService'
import type { WordOfTheDay } from '../types'
import { MARGIN_BOTTOM } from '../constants/spacing'

/**
 * Word of the Day Detail Page
 *
 * Shows detailed information about the daily word including:
 * - Russian and Italian translations
 * - Pronunciation
 * - Description and fun facts
 * - Category and difficulty level
 * - Mark as learned functionality
 */
export const WordOfTheDayDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('learning')

  const [wotd, setWotd] = useState<WordOfTheDay | null>(null)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    loadWordDetails()
  }, [id])

  const loadWordDetails = async () => {
    if (!id) {
      navigate('/')
      return
    }

    setLoading(true)
    try {
      // For now, we'll fetch today's word since we don't have a getWordById method
      // In production, you'd want to add a method to fetch by ID
      const word = await wordOfTheDayService.getTodaysWord()

      if (!word || word.id !== id) {
        // Word not found or ID doesn't match
        navigate('/')
        return
      }

      setWotd(word)

      if (user) {
        const progress = await wordOfTheDayService.getUserProgress(word.id)
        setCompleted(!!progress?.completed_at)
      }
    } catch (error) {
      console.error('Error loading word details:', error)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsLearned = async () => {
    if (!wotd || !user) return

    try {
      await wordOfTheDayService.markAsCompleted(wotd.id)
      setCompleted(true)
    } catch (error) {
      console.error('Error marking as completed:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(i18n.language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white dark:bg-gray-800 shadow">
          <Container width="main" className="py-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </Container>
        </div>
      </div>
    )
  }

  if (!wotd) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <Container width="main" className="py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                data-testid="back-to-dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('wordOfTheDay.title')}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher compact />
              <UserProfile />
            </div>
          </div>
        </Container>
      </div>

      {/* Content */}
      <Container width="main" className="py-8">
        <div className="max-w-3xl mx-auto">
          {/* Date */}
          <div className={`text-center text-sm text-gray-600 dark:text-gray-400 ${MARGIN_BOTTOM.md}`}>
            {formatDate(wotd.date)}
          </div>

          {/* Main Word Card */}
          <Card variant="elevated" size="comfortable" className={`${MARGIN_BOTTOM.lg}`}>
            <div className="text-center space-y-6">
              {/* Word Display */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl">🇷🇺</span>
                  <div>
                    <div className="text-4xl font-bold text-gray-800 dark:text-white">
                      {wotd.russian}
                    </div>
                    <button
                      className="mt-2 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mx-auto"
                      onClick={() => {
                        // Placeholder for audio pronunciation
                        console.log('Play Russian pronunciation')
                      }}
                    >
                      <Volume2 className="w-4 h-4" />
                      {t('wordOfTheDay.pronunciation')}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl">🇮🇹</span>
                  <div>
                    <div className="text-3xl font-semibold text-gray-700 dark:text-gray-300">
                      {wotd.italian}
                    </div>
                    <button
                      className="mt-2 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mx-auto"
                      onClick={() => {
                        // Placeholder for audio pronunciation
                        console.log('Play Italian pronunciation')
                      }}
                    >
                      <Volume2 className="w-4 h-4" />
                      {t('wordOfTheDay.pronunciation')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Category & Difficulty */}
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <BookOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {wotd.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {t('wordOfTheDay.difficultyLevel')}: {wotd.difficulty_level}/5
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Description */}
          <Card variant="default" size="default" className={`${MARGIN_BOTTOM.md}`}>
            <h2 className={`text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 ${MARGIN_BOTTOM.sm}`}>
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              {t('wordOfTheDay.description')}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {wotd.description}
            </p>
          </Card>

          {/* Fun Fact */}
          {wotd.fun_fact && (
            <Card variant="default" size="default" className={`${MARGIN_BOTTOM.md}`}>
              <h2 className={`text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 ${MARGIN_BOTTOM.sm}`}>
                <Sparkles className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                {t('wordOfTheDay.funFact')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {wotd.fun_fact}
              </p>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 flex-col sm:flex-row">
            {!completed ? (
              <button
                onClick={handleMarkAsLearned}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
              >
                <Check className="w-5 h-5" />
                {t('wordOfTheDay.markAsLearned')}
              </button>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold rounded-lg">
                <Check className="w-5 h-5" />
                {t('wordOfTheDay.completed')}
              </div>
            )}

            <button
              onClick={() => navigate('/')}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg transition-colors"
            >
              {t('wordOfTheDay.backToDashboard')}
            </button>
          </div>
        </div>
      </Container>
    </div>
  )
}
