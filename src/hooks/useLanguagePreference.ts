import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { changeLanguage, type SupportedLanguage } from '../lib/i18n'

/**
 * Hook for managing user language preference with database persistence
 *
 * Automatically loads the user's saved language preference on mount
 * and saves changes to the database when the language is changed.
 *
 * For authenticated users: Syncs with user_preferences table
 * For guests: Uses localStorage only (via i18n)
 */
export function useLanguagePreference() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load user's language preference from database
   */
  const loadLanguagePreference = useCallback(async () => {
    if (!user) return

    try {
      const { data, error: fetchError } = await supabase
        .from('user_preferences')
        .select('language_preference')
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        // If user_preferences row doesn't exist yet, that's okay
        if (fetchError.code === 'PGRST116') {
          console.log('No user preferences found yet, using default language')
          return
        }
        throw fetchError
      }

      if (data?.language_preference) {
        // Apply the saved language preference
        await changeLanguage(data.language_preference)
      }
    } catch (err) {
      console.error('Error loading language preference:', err)
      setError(err instanceof Error ? err.message : 'Failed to load language preference')
    }
  }, [user])

  /**
   * Save language preference to database
   */
  const saveLanguagePreference = useCallback(async (language: SupportedLanguage) => {
    if (!user) {
      // For guests, just change the language (localStorage only)
      await changeLanguage(language)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // First, change the language in i18n (localStorage + UI)
      await changeLanguage(language)

      // Then save to database
      const { error: upsertError } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: user.id,
            language_preference: language,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
            ignoreDuplicates: false,
          }
        )

      if (upsertError) throw upsertError

      console.log(`Language preference saved: ${language}`)
    } catch (err) {
      console.error('Error saving language preference:', err)
      setError(err instanceof Error ? err.message : 'Failed to save language preference')
      throw err // Re-throw so caller knows it failed
    } finally {
      setLoading(false)
    }
  }, [user])

  // Load language preference when user logs in
  useEffect(() => {
    if (!user) return // Don't load preferences if no user (prevents issues during logout)
    loadLanguagePreference()
  }, [user, loadLanguagePreference])

  return {
    saveLanguagePreference,
    loadLanguagePreference,
    loading,
    error,
  }
}
