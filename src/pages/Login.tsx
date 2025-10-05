import React from 'react'
import { LoginForm } from '../components/auth/LoginForm'

/**
 * Login Page
 *
 * Main login page that displays the LoginForm component.
 * This page is accessible to unauthenticated users via the /login route.
 */
export const Login: React.FC = () => {
  return <LoginForm />
}
