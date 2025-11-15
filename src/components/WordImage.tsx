import React, { useState, useEffect } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { wordImageService } from '../services/wordImageService'
import { useImagePreferences } from '../hooks/useImagePreferences'
import type { WordImage as WordImageType } from '../types'

interface WordImageProps {
  wordId: number
  wordText: string
  hasAnswered?: boolean
  className?: string
}

/**
 * WordImage component displays images for words to support visual learning
 * Respects user preferences for image display timing and size
 */
export const WordImage: React.FC<WordImageProps> = ({
  wordId,
  wordText,
  hasAnswered = false,
  className = '',
}) => {
  const [image, setImage] = useState<WordImageType | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const { preferences, loading: preferencesLoading } = useImagePreferences()

  useEffect(() => {
    loadImage()
  }, [wordId])

  const loadImage = async () => {
    try {
      setLoading(true)
      setImageError(false)
      const data = await wordImageService.getImageForWord(wordId)
      setImage(data)
    } catch (error) {
      console.error('Error loading image:', error)
      setImageError(true)
    } finally {
      setLoading(false)
    }
  }

  // Check if image should be displayed based on user preferences
  const shouldShowImage = (): boolean => {
    if (preferencesLoading || !preferences) return false
    if (!preferences.show_images || !image) return false
    if (preferences.image_timing === 'never') return false
    if (preferences.image_timing === 'after_answer' && !hasAnswered) return false
    return true
  }

  // Handle image loading errors
  const handleImageError = () => {
    setImageError(true)
  }

  // Don't render anything if loading preferences
  if (preferencesLoading) {
    return null
  }

  // Show loading skeleton while image is being fetched
  if (loading && preferences?.show_images) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg ${getSizeClasses(preferences.image_size)} ${className}`}
        role="status"
        aria-label="Loading image"
      >
        <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
      </div>
    )
  }

  // Don't render if there's an error, no image, or shouldn't show
  if (imageError || !image || !shouldShowImage()) {
    return null
  }

  const sizeClasses = getSizeClasses(preferences.image_size)

  return (
    <div className={`relative group ${className}`}>
      <img
        src={image.thumbnail_url || image.image_url}
        alt={image.alt_text || wordText}
        className={`${sizeClasses} object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm transition-transform hover:scale-105`}
        loading="lazy"
        onError={handleImageError}
      />

      {/* Attribution overlay */}
      {image.source_attribution && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 text-center rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {image.source_attribution}
        </div>
      )}

      {/* Word tooltip on hover */}
      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
        {wordText}
      </div>
    </div>
  )
}

/**
 * Get CSS classes for image size based on user preference
 */
function getSizeClasses(size: 'small' | 'medium' | 'large'): string {
  const sizeMap = {
    small: 'w-24 h-24',
    medium: 'w-32 h-32',
    large: 'w-48 h-48',
  }
  return sizeMap[size]
}
