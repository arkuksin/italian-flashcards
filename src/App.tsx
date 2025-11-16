import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Analytics } from './pages/Analytics'
import { Callback } from './pages/Callback'
import { PrivacyPolicy } from './pages/PrivacyPolicy'
import { DemoDeck } from './pages/DemoDeck'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { SkipLink } from './components/layout/SkipLink'
import { Modal } from './components/ui/Modal'
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp'
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts'

/**
 * Main App Component with React Router
 *
 * Handles routing for the application:
 * - /login: Login page (public)
 * - /auth/callback: OAuth callback handler (public)
 * - /: Dashboard with flashcards (protected)
 *
 * Protected routes automatically redirect to /login if user is not authenticated.
 * If user is already authenticated and tries to access /login, they are redirected to /.
 */
function App() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)

  // Global keyboard shortcuts (? to show help)
  useGlobalShortcuts({
    onShowHelp: () => setShowShortcutsHelp(true),
  })

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (!loading && user && location.pathname === '/login') {
      navigate('/', { replace: true })
    }
  }, [user, loading, location.pathname, navigate])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800"
        data-testid="app-loading"
      >
        <LoadingSpinner size="large" message="Loading your study plan..." />
      </div>
    )
  }

  return (
    <>
      <SkipLink />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<Callback />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/demo" element={<DemoDeck />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            user ? (
              <Dashboard />
            ) : (
              <Navigate to="/login" replace state={{ from: location }} />
            )
          }
        />
        <Route
          path="/analytics"
          element={
            user ? (
              <Analytics />
            ) : (
              <Navigate to="/login" replace state={{ from: location }} />
            )
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Keyboard Shortcuts Help Modal */}
      <Modal
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
        title="Keyboard Shortcuts"
        maxWidth="2xl"
      >
        <KeyboardShortcutsHelp />
      </Modal>
    </>
  )
}

export default App
