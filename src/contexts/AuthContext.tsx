import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signInWithGitHub: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const handleAuthError = (error: AuthError): string => {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password'
    case 'Email not confirmed':
      return 'Please check your email and click the confirmation link'
    case 'Password should be at least 6 characters':
      return 'Password must be at least 6 characters long'
    case 'User already registered':
      return 'An account with this email already exists'
    case 'Signup requires a valid password':
      return 'Please provide a valid password'
    case 'Invalid email':
      return 'Please provide a valid email address'
    default:
      return error.message || 'An authentication error occurred'
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if we're in test mode (unit tests only, not E2E tests)
    // Only enable auto-auth for Jest/Vitest unit tests, not Playwright E2E tests

    // Debug logging for E2E test investigation
    console.log('🔍 AuthContext Debug Info:', {
      'import.meta.env.VITEST': import.meta.env.VITEST,
      'import.meta.env.JEST': import.meta.env.JEST,
      'import.meta.env.VITE_TEST_MODE': import.meta.env.VITE_TEST_MODE,
      'import.meta.env.VITE_PLAYWRIGHT_TEST': import.meta.env.VITE_PLAYWRIGHT_TEST,
      'import.meta.env.DEV': import.meta.env.DEV,
      'import.meta.env.PROD': import.meta.env.PROD,
      'import.meta.env.NODE_ENV': import.meta.env.NODE_ENV,
      'window.location.search': window.location.search,
      'window.location.href': window.location.href,
      'navigator.userAgent': navigator.userAgent.includes('Playwright') ? 'Playwright detected' : 'No Playwright',
    })

    // Explicit conditions for when to use mock authentication
    const isVitestTest = import.meta.env.VITEST === 'true'
    const isJestTest = import.meta.env.JEST === 'true'
    const hasTestModeParam = window.location.search.includes('test-mode=true')
    const isPlaywrightE2E = navigator.userAgent.includes('Playwright')
    const isProductionBuild = import.meta.env.PROD === true
    const isVercelPreview = window.location.hostname.includes('vercel.app')

    // Only use mock auth for unit tests, NOT for E2E tests or production
    const isUnitTestMode = (isVitestTest || isJestTest || hasTestModeParam) &&
                          !isPlaywrightE2E &&
                          !isProductionBuild &&
                          !isVercelPreview

    console.log('🔍 Test mode evaluation:', {
      isUnitTestMode,
      isVitestTest,
      isJestTest,
      hasTestModeParam,
      isPlaywrightE2E,
      isProductionBuild,
      isVercelPreview
    })

    if (isUnitTestMode) {
      // In test mode, automatically provide a mock authenticated user
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as User

      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: mockUser
      } as Session

      console.log('🧪 Unit test mode: Using mock authentication')
      setUser(mockUser)
      setSession(mockSession)
      setLoading(false)
      return
    }

    // Get initial session (normal production flow)
    const getInitialSession = async () => {
      console.log('🔍 Starting normal authentication flow')
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('🔍 Supabase session response:', { session: !!session, error, hasUser: !!session?.user })
        if (error) {
          console.error('Error getting session:', error)
        }
        setSession(session)
        setUser(session?.user ?? null)
        console.log('🔍 Auth state set:', { hasUser: !!session?.user, loading: false })
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes (skip in unit test mode)
    if (!isUnitTestMode) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle session refresh
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully')
        }

        // Handle sign out
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
        }
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  // Sign out method
  const signOut = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        throw error
      }
    } catch (error) {
      console.error('Sign out failed:', error)
      throw error
    }
  }

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: { ...error, message: handleAuthError(error) } as AuthError }
      }

      return { error: null }
    } catch (error) {
      console.error('Sign in failed:', error)
      return {
        error: {
          message: 'An unexpected error occurred during sign in',
          name: 'SignInError'
        } as AuthError
      }
    }
  }

  // Sign up with email and password
  const signUpWithEmail = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        return { error: { ...error, message: handleAuthError(error) } as AuthError }
      }

      return { error: null }
    } catch (error) {
      console.error('Sign up failed:', error)
      return {
        error: {
          message: 'An unexpected error occurred during sign up',
          name: 'SignUpError'
        } as AuthError
      }
    }
  }

  // Reset password
  const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        return { error: { ...error, message: handleAuthError(error) } as AuthError }
      }

      return { error: null }
    } catch (error) {
      console.error('Password reset failed:', error)
      return {
        error: {
          message: 'An unexpected error occurred during password reset',
          name: 'PasswordResetError'
        } as AuthError
      }
    }
  }

  // Sign in with Google
  const signInWithGoogle = async (): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        return { error: { ...error, message: handleAuthError(error) } as AuthError }
      }

      return { error: null }
    } catch (error) {
      console.error('Google sign in failed:', error)
      return {
        error: {
          message: 'An unexpected error occurred during Google sign in',
          name: 'GoogleSignInError'
        } as AuthError
      }
    }
  }

  // Sign in with GitHub
  const signInWithGitHub = async (): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        return { error: { ...error, message: handleAuthError(error) } as AuthError }
      }

      return { error: null }
    } catch (error) {
      console.error('GitHub sign in failed:', error)
      return {
        error: {
          message: 'An unexpected error occurred during GitHub sign in',
          name: 'GitHubSignInError'
        } as AuthError
      }
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signOut,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signInWithGoogle,
    signInWithGitHub,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}