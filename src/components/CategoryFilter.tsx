import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tag, Check, AlertCircle, Loader2 } from 'lucide-react'
import { categoryService } from '../services/categoryService'
import type { CategoryInfo } from '../types'

interface CategoryFilterProps {
  userId: string
  onSelectionChange: (categories: string[]) => void
  initialSelection?: string[]
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  userId,
  onSelectionChange,
  initialSelection = []
}) => {
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelection))
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [userId])

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)

      const [stats, savedSelection, suggested] = await Promise.all([
        categoryService.getCategoryStatistics(),
        categoryService.getSelectedCategories(userId),
        categoryService.getSuggestedCategory(userId)
      ])

      setCategories(stats)

      // Use initial selection if provided, otherwise use saved selection
      const categoriesToSelect = initialSelection.length > 0 ? initialSelection : savedSelection
      setSelected(new Set(categoriesToSelect))
      setSuggestion(suggested)

      // Notify parent of initial selection
      onSelectionChange(categoriesToSelect)
    } catch (err) {
      console.error('Error loading categories:', err)
      setError('Failed to load categories. Please try again.')
    } finally {
      setLoading(false)
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <span className="ml-2 text-sm text-gray-500">Lade Kategorien...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">{error}</p>
        <button
          onClick={loadCategories}
          className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium underline"
        >
          Erneut versuchen
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
      data-testid="category-filter"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
            Kategorien filtern (optional)
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({selected.size} ausgewählt)
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded transition-colors"
            data-testid="select-all-categories"
          >
            Alle
          </button>
          <button
            onClick={handleSelectNone}
            className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded transition-colors"
            data-testid="select-none-categories"
          >
            Keine
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
            <div className="flex-1 text-sm">
              <span className="font-medium text-gray-800 dark:text-gray-200">Empfehlung: </span>
              <span className="text-gray-700 dark:text-gray-300">
                "{suggestion}" hat niedrigste Accuracy
              </span>
              <button
                onClick={() => handleToggle(suggestion)}
                className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                data-testid="toggle-suggested-category"
              >
                {selected.has(suggestion) ? '✓ Ausgewählt' : '+ Auswählen'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
        {categories.map((category, index) => (
          <motion.label
            key={category.category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              selected.has(category.category)
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
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
                {category.category}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div>{category.total_words} Wörter</div>
                {category.learned_words > 0 && (
                  <div>
                    {category.learned_words} gelernt
                    {category.avg_accuracy !== null && category.avg_accuracy > 0 && (
                      <span className="ml-1">
                        ({category.avg_accuracy.toFixed(0)}% Accuracy)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            {selected.has(category.category) && (
              <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            )}
          </motion.label>
        ))}
      </div>

      {/* Save Preferences Button */}
      <button
        onClick={handleSavePreferences}
        disabled={saving}
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="save-category-preferences"
      >
        {saving ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Speichere...
          </>
        ) : (
          'Als Standard speichern'
        )}
      </button>
    </motion.div>
  )
}
