import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { ImagePreferences, ImageTiming, ImageSize } from '../types'

/**
 * Hook for managing user image preferences with database persistence
 *
 * Automatically loads the user's saved image preferences on mount
 * and saves changes to the database when preferences are updated.
 *
 * For authenticated users: Syncs with user_preferences table
 * For guests: Uses localStorage
 */
export function useImagePreferences() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<ImagePreferences>({
    show_images: true,
    image_timing: 'always',
    image_size: 'medium',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load user's image preferences from database or localStorage
   */
  const loadImagePreferences = useCallback(async () => {
    if (!user) {
      // Load from localStorage for guests
      const stored = localStorage.getItem('image_preferences')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setPreferences(parsed)
        } catch (err) {
          console.error('Error parsing stored image preferences:', err)
        }
      }
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('user_preferences')
        .select('show_images, image_timing, image_size')
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        // If user_preferences row doesn't exist yet, use defaults
        if (fetchError.code === 'PGRST116') {
          console.log('No user preferences found yet, using default image settings')
          setLoading(false)
          return
        }
        throw fetchError
      }

      if (data) {
        setPreferences({
          show_images: data.show_images ?? true,
          image_timing: (data.image_timing as ImageTiming) ?? 'always',
          image_size: (data.image_size as ImageSize) ?? 'medium',
        })
      }
    } catch (err) {
      console.error('Error loading image preferences:', err)
      setError(err instanceof Error ? err.message : 'Failed to load image preferences')
    } finally {
      setLoading(false)
    }
  }, [user])

  /**
   * Save image preferences to database or localStorage
   */
  const saveImagePreferences = useCallback(
    async (updates: Partial<ImagePreferences>) => {
      const newPreferences = { ...preferences, ...updates }
      setPreferences(newPreferences)

      if (!user) {
        // Save to localStorage for guests
        localStorage.setItem('image_preferences', JSON.stringify(newPreferences))
        return
      }

      setError(null)

      try {
        // Save to database for authenticated users
        const { error: upsertError } = await supabase
          .from('user_preferences')
          .upsert(
            {
              user_id: user.id,
              show_images: newPreferences.show_images,
              image_timing: newPreferences.image_timing,
              image_size: newPreferences.image_size,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id',
              ignoreDuplicates: false,
            }
          )

        if (upsertError) throw upsertError

        console.log('Image preferences saved:', newPreferences)
      } catch (err) {
        console.error('Error saving image preferences:', err)
        setError(err instanceof Error ? err.message : 'Failed to save image preferences')
        throw err
      }
    },
    [user, preferences]
  )

  // Load preferences when component mounts or user changes
  useEffect(() => {
    loadImagePreferences()
  }, [loadImagePreferences])

  return {
    preferences,
    loading,
    error,
    updatePreferences: saveImagePreferences,
  }
}
