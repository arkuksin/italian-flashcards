import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LoginForm } from './auth/LoginForm'
import { LoadingSpinner } from './ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, session } = useAuth()
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    // Mark auth as checked after initial load
    if (!loading) {
      setAuthChecked(true)
    }
  }, [loading])

  // Show initial loading while checking authentication
  if (!authChecked || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800"
        data-testid="auth-loading"
      >
        <LoadingSpinner size="large" message="Checking authentication..." />
      </div>
    )
  }

  // Check for session expiration
  if (session && session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
    return <LoginForm message="Your session has expired. Please sign in again." />
  }

  // Show login form if user is not authenticated
  if (!user) {
    return <LoginForm />
  }

  // Render protected content for authenticated users
  return (
    <div data-testid="protected-content">
      {children}
    </div>
  )
}