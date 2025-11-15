import React from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useImagePreferences } from '../../hooks/useImagePreferences'
import type { ImageTiming, ImageSize } from '../../types'

/**
 * ImageSettings component provides UI controls for configuring image display preferences
 * Allows users to control whether images are shown, when they appear, and their size
 */
export const ImageSettings: React.FC = () => {
  const { t } = useTranslation('common')
  const { preferences, loading, updatePreferences } = useImagePreferences()

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const handleToggleImages = (enabled: boolean) => {
    updatePreferences({ show_images: enabled })
  }

  const handleTimingChange = (timing: ImageTiming) => {
    updatePreferences({ image_timing: timing })
  }

  const handleSizeChange = (size: ImageSize) => {
    updatePreferences({ image_size: size })
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <ImageIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('settings.images.title')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('settings.images.description')}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Enable/Disable Images */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={preferences.show_images}
              onChange={(e) => handleToggleImages(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 transition-colors"></div>
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
          </div>
          <div className="flex-1">
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {t('settings.images.showImages')}
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('settings.images.showImagesHint')}
            </p>
          </div>
        </label>

        {/* Timing Settings */}
        {preferences.show_images && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('settings.images.whenToShow')}
              </label>
              <div className="space-y-2">
                {(
                  [
                    { value: 'always', label: t('settings.images.timing.always') },
                    { value: 'after_answer', label: t('settings.images.timing.afterAnswer') },
                    { value: 'never', label: t('settings.images.timing.never') },
                  ] as const
                ).map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors"
                  >
                    <input
                      type="radio"
                      name="image_timing"
                      value={option.value}
                      checked={preferences.image_timing === option.value}
                      onChange={(e) => handleTimingChange(e.target.value as ImageTiming)}
                      className="w-4 h-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Size Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('settings.images.imageSize')}
              </label>
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    { value: 'small', label: t('settings.images.size.small') },
                    { value: 'medium', label: t('settings.images.size.medium') },
                    { value: 'large', label: t('settings.images.size.large') },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSizeChange(option.value)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all font-medium ${
                      preferences.image_size === option.value
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.images.preview')}
              </p>
              <div className="flex items-center gap-4">
                <div
                  className={`bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center ${getSizePreviewClass(preferences.image_size)}`}
                >
                  <ImageIcon className="text-gray-400 dark:text-gray-500" size={getSizePreviewIconSize(preferences.image_size)} />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('settings.images.previewHint', { size: t(`settings.images.size.${preferences.image_size}`) })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Get CSS classes for image size preview
 */
function getSizePreviewClass(size: ImageSize): string {
  const sizeMap = {
    small: 'w-24 h-24',
    medium: 'w-32 h-32',
    large: 'w-48 h-48',
  }
  return sizeMap[size]
}

/**
 * Get icon size for preview based on image size
 */
function getSizePreviewIconSize(size: ImageSize): number {
  const sizeMap = {
    small: 32,
    medium: 48,
    large: 64,
  }
  return sizeMap[size]
}
