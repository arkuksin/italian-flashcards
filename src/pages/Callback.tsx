import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

/**
 * OAuth Callback Handler
 *
 * This page handles the OAuth redirect after successful authentication with Google/GitHub.
 * It processes the authentication code/token from the URL, exchanges it for a session,
 * and redirects the user to the main application.
 */
export const Callback: React.FC = () => {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash/query parameters
        // Supabase automatically processes the OAuth callback
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Error getting session:', sessionError)
          setError(sessionError.message)

          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login', { replace: true })
          }, 3000)
          return
        }

        if (session) {
          console.log('OAuth authentication successful')
          // Redirect to the main app
          navigate('/', { replace: true })
        } else {
          console.log('No session found after OAuth callback')
          setError('No session found. Please try logging in again.')

          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login', { replace: true })
          }, 3000)
        }
      } catch (err) {
        console.error('Error in OAuth callback:', err)
        setError('An unexpected error occurred during authentication.')

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 3000)
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="text-center">
        {error ? (
          <div className="max-w-md mx-auto">
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
                Authentication Error
              </h2>
              <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Redirecting to login page...
              </p>
            </div>
          </div>
        ) : (
          <div>
            <LoadingSpinner size="large" message="Completing authentication..." />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Please wait while we sign you in
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
