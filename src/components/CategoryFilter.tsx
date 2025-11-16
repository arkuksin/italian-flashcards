import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Tag, Check, AlertCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { categoryService } from '../services/categoryService'
import type { CategoryInfo } from '../types'
import { Card } from './ui/Card'
import { VERTICAL_SPACING, GAP } from '../constants/spacing'

interface CategoryFilterProps {
  userId: string
  onSelectionChange: (categories: string[]) => void
  initialSelection?: string[]
}

// Stable empty array to prevent re-render loops
const EMPTY_ARRAY: string[] = []

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  userId,
  onSelectionChange,
  initialSelection = EMPTY_ARRAY
}) => {
  const { t } = useTranslation('dashboard')
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelection))
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const hasNotifiedRef = useRef(false)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true)
        setError(null)

        const [stats, savedSelection, suggested] = await Promise.all([
          categoryService.getCategoryStatistics(),
          categoryService.getSelectedCategories(userId),
          categoryService.getSuggestedCategory()
        ])

        setCategories(stats)

        // Use initial selection if provided, otherwise use saved selection
        const categoriesToSelect = initialSelection.length > 0 ? initialSelection : savedSelection
        setSelected(new Set(categoriesToSelect))
        setSuggestion(suggested)

        // Only notify parent once on initial load
        if (!hasNotifiedRef.current) {
          hasNotifiedRef.current = true
          onSelectionChange(categoriesToSelect)
        }
      } catch (err) {
        console.error('Error loading categories:', err)
        setError('Failed to load categories. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, initialSelection, retryKey])

  const handleRetry = () => {
    setRetryKey(prev => prev + 1)
  }

  const handleToggle = (category: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(category)) {
      newSelected.delete(category)
    } else {
      newSelected.add(category)
    }
    setSelected(newSelected)
    onSelectionChange(Array.from(newSelected))
  }

  const handleKeyDown = (e: React.KeyboardEvent, category: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle(category)
    }
  }

  const handleSelectAll = () => {
    const all = new Set(categories.map(c => c.category))
    setSelected(all)
    onSelectionChange(Array.from(all))
  }

  const handleSelectNone = () => {
    setSelected(new Set())
    onSelectionChange([])
  }

  const handleSavePreferences = async () => {
    try {
      setSaving(true)
      const selections: Record<string, boolean> = {}
      categories.forEach(cat => {
        selections[cat.category] = selected.has(cat.category)
      })
      await categoryService.bulkUpdatePreferences(userId, selections)
    } catch (err) {
      console.error('Error saving preferences:', err)
      setError('Failed to save preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Helper function to translate category names
  const getCategoryLabel = (categoryKey: string): string => {
    // Try to get translation from dashboard.categories namespace
    const translationKey = `categories.${categoryKey}`
    const translated = t(translationKey, { defaultValue: '' })

    // If no translation found, return the category key capitalized
    return translated || categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8" data-testid="category-filter">
        <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
        <span className="ml-2 text-body-md text-gray-500 dark:text-gray-400">{t('filter.loading')}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" data-testid="category-filter">
        <p className="text-body-md text-red-800 dark:text-red-200">{t('filter.error')}</p>
        <button
          onClick={handleRetry}
          className="mt-2 text-label-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
        >
          {t('filter.retry')}
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={VERTICAL_SPACING.md}
      data-testid="category-filter"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
            {t('filter.title')}
          </h3>
          <span className="text-body-sm text-gray-500 dark:text-gray-400">
            ({t('filter.selected', { count: selected.size })})
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="text-label-md px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded transition-colors"
            data-testid="select-all-categories"
          >
            {t('filter.all')}
          </button>
          <button
            onClick={handleSelectNone}
            className="text-label-md px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded transition-colors"
            data-testid="select-none-categories"
          >
            {t('filter.none')}
          </button>
        </div>
      </div>

      {/* Suggestion */}
      {suggestion && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
          data-testid="category-suggestion"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-body-md">
              <span className="font-medium text-gray-800 dark:text-gray-200">{t('filter.suggestion')}: </span>
              <span className="text-gray-700 dark:text-gray-300">
                {t('filter.suggestionText', { category: getCategoryLabel(suggestion) })}
              </span>
              <button
                onClick={() => handleToggle(suggestion)}
                className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                data-testid="toggle-suggested-category"
              >
                {selected.has(suggestion) ? t('filter.selected_label') : t('filter.select')}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Category Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${GAP.xs} max-h-80 overflow-y-auto pr-1`}>
        {categories.map((category, index) => (
          <Card
            key={category.category}
            variant="outlined"
            size="compact"
            as={motion.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent) => handleKeyDown(e, category.category)}
            className={`flex items-start gap-3 cursor-pointer transition-all duration-200 ${
              selected.has(category.category)
                ? '!border-blue-500 !bg-blue-50 dark:!bg-blue-900/20 dark:!border-blue-400'
                : 'hover:!border-gray-300 dark:hover:!border-gray-600'
            }`}
            data-testid={`category-option-${category.category}`}
          >
            <input
              type="checkbox"
              checked={selected.has(category.category)}
              onChange={() => handleToggle(category.category)}
              className="mt-1 w-5 h-5 text-blue-600 rounded"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 dark:text-gray-200 truncate">
                {getCategoryLabel(category.category)}
              </div>
              <div className="text-body-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div>{t('filter.wordsCount', { count: category.total_words })}</div>
                {category.learned_words > 0 && (
                  <div>
                    {t('filter.learnedCount', { count: category.learned_words })}
                    {category.avg_accuracy !== null && category.avg_accuracy > 0 && (
                      <span className="ml-1">
                        ({category.avg_accuracy.toFixed(0)}% {t('filter.accuracyLabel')})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            {selected.has(category.category) && (
              <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            )}
          </Card>
        ))}
      </div>

      {/* Save Preferences Button */}
      <button
        onClick={handleSavePreferences}
        disabled={saving}
        className="flex items-center gap-2 text-body-md text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="save-category-preferences"
      >
        {saving ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            {t('filter.saving')}
          </>
        ) : (
          t('filter.saveAsDefault')
        )}
      </button>
    </motion.div>
  )
}
