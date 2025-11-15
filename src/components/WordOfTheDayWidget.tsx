import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Star, ChevronRight, Check } from 'lucide-react'
import { Card } from './ui/Card'
import { wordOfTheDayService } from '../services/wordOfTheDayService'
import type { WordOfTheDay, WotDHistoryDay } from '../types'
import { MARGIN_BOTTOM } from '../constants/spacing'

export const WordOfTheDayWidget = () => {
  const { t, i18n } = useTranslation('learning')
  const navigate = useNavigate()
  const [wotd, setWotd] = useState<WordOfTheDay | null>(null)
  const [completed, setCompleted] = useState(false)
  const [last7Days, setLast7Days] = useState<WotDHistoryDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWotd()
  }, [])

  const loadWotd = async () => {
    try {
      const word = await wordOfTheDayService.getTodaysWord()
      setWotd(word)

      if (word) {
        const progress = await wordOfTheDayService.getUserProgress(word.id)
        setCompleted(!!progress?.completed_at)

        // Mark as viewed
        await wordOfTheDayService.markAsViewed(word.id)
      }

      const history = await wordOfTheDayService.getLast7Days()
      setLast7Days(history)
    } catch (error) {
      console.error('Error loading WotD:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLearn = () => {
    if (wotd) {
      navigate(`/word-of-the-day/${wotd.id}`)
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
      <Card variant="default" size="default">
        <div className="h-64 animate-pulse bg-gray-100 dark:bg-gray-700 rounded-lg" />
      </Card>
    )
  }

  if (!wotd) {
    return (
      <Card variant="default" size="default">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Star className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            {t('wordOfTheDay.noWordToday')}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card
      variant="default"
      size="default"
      className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-700"
      data-testid="word-of-the-day-widget"
    >
      {/* Header */}
      <div className={`flex items-center gap-2 ${MARGIN_BOTTOM.sm}`}>
        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
          {t('wordOfTheDay.title')}
        </h3>
      </div>

      {/* Date */}
      <div className={`text-xs text-gray-600 dark:text-gray-400 ${MARGIN_BOTTOM.sm}`}>
        {formatDate(wotd.date)}
      </div>

      {/* Word Card */}
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700 ${MARGIN_BOTTOM.md}`}>
        <div className="text-center space-y-2">
          <div>
            <span className="mr-2">🇷🇺</span>
            <span className="text-2xl font-bold text-gray-800 dark:text-white">
              {wotd.russian}
            </span>
          </div>
          <div>
            <span className="mr-2">🇮🇹</span>
            <span className="text-xl text-gray-700 dark:text-gray-300">
              {wotd.italian}
            </span>
          </div>
          <div className="flex justify-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 inline-block px-3 py-1 rounded-full">
              {wotd.category}
            </div>
          </div>
        </div>

        <p className={`text-sm text-gray-700 dark:text-gray-300 text-center ${MARGIN_BOTTOM.none}`} style={{ marginTop: '12px' }}>
          {wotd.description}
        </p>

        {/* Action Button or Completion Status */}
        <div style={{ marginTop: '16px' }}>
          {completed ? (
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">
                {t('wordOfTheDay.learnedToday')}
              </span>
            </div>
          ) : (
            <button
              onClick={handleLearn}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors"
            >
              {t('wordOfTheDay.learnNow')}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* History - Last 7 Days */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">
          {t('wordOfTheDay.last7Days')}
        </span>
        <div className="flex gap-1">
          {last7Days.map((day) => (
            <div
              key={day.date}
              className={`w-6 h-6 rounded flex items-center justify-center ${
                day.completed
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              }`}
              title={day.date}
            >
              {day.completed ? '✓' : '○'}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
