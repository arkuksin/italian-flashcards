# Phase 2.6: Login/Signup Components

## Task Description
Create comprehensive login and signup components using Supabase Auth UI, providing multiple authentication methods including email/password and social logins with a beautiful, responsive design.

## Claude Code Prompt

```
I need you to automatically create comprehensive login and signup components using the Write tool to generate all authentication UI files. These components should provide a seamless authentication experience with multiple login options and proper error handling.

Please help me with the following:

1. **Automated Login Form Creation:**
   Use the Write tool to create `src/components/auth/LoginForm.tsx`:

   ```typescript
   import React, { useState } from 'react'
   import { Auth } from '@supabase/auth-ui-react'
   import { ThemeSupa } from '@supabase/auth-ui-shared'
   import { supabase } from '../../lib/supabase'
   import { useAuth } from '../../contexts/AuthContext'

   interface LoginFormProps {
     message?: string
   }

   export const LoginForm: React.FC<LoginFormProps> = ({ message }) => {
     const [authMode, setAuthMode] = useState<'sign_in' | 'sign_up'>('sign_in')
     const { loading } = useAuth()

     return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
         <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mx-4">
           {/* Header */}
           <div className="text-center mb-8">
             <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
               Italian Flashcards
             </h1>
             <p className="text-gray-600 dark:text-gray-300 mt-2">
               {authMode === 'sign_in'
                 ? 'Sign in to continue learning'
                 : 'Create an account to save your progress'
               }
             </p>
             {message && (
               <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md text-sm">
                 {message}
               </div>
             )}
           </div>

           {/* Auth Form */}
           <Auth
             supabaseClient={supabase}
             view={authMode}
             appearance={%raw%}{{
               theme: ThemeSupa,
               variables: {
                 default: {
                   colors: {
                     brand: '#3b82f6',
                     brandAccent: '#1d4ed8',
                   }
                 }
               },
               className: {
                 container: 'auth-container',
                 button: 'auth-button',
                 input: 'auth-input',
               }
             }}{%endraw%}
             providers={['google', 'github']}
             redirectTo={window.location.origin}
             showLinks={false}
           />

           {/* Toggle between sign in and sign up */}
           <div className="mt-6 text-center">
             <button
               onClick={() => setAuthMode(authMode === 'sign_in' ? 'sign_up' : 'sign_in')}
               className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
               disabled={loading}
             >
               {authMode === 'sign_in'
                 ? "Don't have an account? Sign up"
                 : 'Already have an account? Sign in'
               }
             </button>
           </div>
         </div>
       </div>
     )
   }
   ```

2. **Automated Auth Styling Creation:**
   Use the Write tool to create `src/styles/auth.css`:

   ```css
   .auth-container {
     @apply space-y-4;
   }

   .auth-button {
     @apply w-full px-4 py-2 text-white bg-blue-600 hover:bg-blue-700
            focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm
            transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
   }

   .auth-input {
     @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600
            rounded-md shadow-sm placeholder-gray-400 focus:outline-none
            focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700
            dark:text-white;
   }

   /* Social login buttons */
   .sbui-btn--oauth {
     @apply w-full px-4 py-2 border border-gray-300 dark:border-gray-600
            rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700
            hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200;
   }

   /* Error messages */
   .sbui-typography--text-error {
     @apply text-red-600 dark:text-red-400 text-sm;
   }

   /* Success messages */
   .sbui-typography--text-success {
     @apply text-green-600 dark:text-green-400 text-sm;
   }
   ```

3. **Automated Error Handling Component:**
   Use the Write tool to create `src/components/auth/AuthErrorDisplay.tsx`:

   ```typescript
   import React from 'react'
   import { AuthError } from '@supabase/supabase-js'

   interface AuthErrorDisplayProps {
     error: AuthError | null
     onDismiss?: () => void
   }

   export const AuthErrorDisplay: React.FC<AuthErrorDisplayProps> = ({
     error,
     onDismiss
   }) => {
     if (!error) return null

     const getErrorMessage = (error: AuthError) => {
       switch (error.message) {
         case 'Invalid login credentials':
           return 'Invalid email or password. Please check your credentials and try again.'
         case 'Email not confirmed':
           return 'Please check your email and click the confirmation link before signing in.'
         case 'Password should be at least 6 characters':
           return 'Password must be at least 6 characters long.'
         case 'User already registered':
           return 'An account with this email already exists. Try signing in instead.'
         case 'Invalid email':
           return 'Please enter a valid email address.'
         default:
           return error.message || 'An authentication error occurred. Please try again.'
       }
     }

     return (
       <div className="mb-4 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
         <div className="flex justify-between items-start">
           <div className="flex">
             <div className="flex-shrink-0">
               <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
               </svg>
             </div>
             <div className="ml-3">
               <p className="text-sm text-red-700 dark:text-red-200">
                 {getErrorMessage(error)}
               </p>
             </div>
           </div>
           {onDismiss && (
             <button
               onClick={onDismiss}
               className="text-red-400 hover:text-red-600 dark:hover:text-red-200"
             >
               <span className="sr-only">Dismiss</span>
               <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
               </svg>
             </button>
           )}
         </div>
       </div>
     )
   }
   ```

4. **Automated Email Confirmation Component:**
   Use the Write tool to create `src/components/auth/EmailConfirmation.tsx`:

   ```typescript
   import React from 'react'

   export const EmailConfirmation: React.FC = () => {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
         <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mx-4 text-center">
           <div className="mb-6">
             <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
               <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
               </svg>
             </div>
           </div>
           <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
             Check your email
           </h2>
           <p className="text-gray-600 dark:text-gray-300 mb-6">
             We've sent you a confirmation link. Please check your email and click the link to complete your registration.
           </p>
           <p className="text-sm text-gray-500 dark:text-gray-400">
             Didn't receive the email? Check your spam folder or contact support.
           </p>
         </div>
       </div>
     )
   }
   ```

5. **Social Login Configuration:**
   Help me configure social login providers in Supabase:
   - Google OAuth setup
   - GitHub OAuth setup
   - Proper redirect URLs configuration
   - Provider-specific error handling

6. **Mobile Responsiveness:**
   Ensure the forms work well on mobile devices:
   - Touch-friendly button sizes
   - Proper viewport handling
   - Responsive layout
   - Keyboard accessibility

7. **Integration with App:**
   Show me how to integrate these components:
   - Update App.tsx to handle different auth states
   - Handle post-login navigation
   - Manage auth state transitions
   - Handle email confirmation flow

8. **Testing the Authentication Flow:**
   Help me test the complete authentication experience:
   - Sign up with email/password
   - Email confirmation process
   - Sign in with existing account
   - Social login functionality
   - Error handling scenarios

**Important**: Use the Write tool to create ALL authentication components and styles automatically. Generate complete, production-ready files with responsive design, error handling, and accessibility features.

**Expected Outcome**: Complete authentication system with login/signup forms, error handling, email confirmation, and custom styling - all files created automatically.
```

## Prerequisites
- Completed Phase 2.5 (Protected Route component)
- Supabase Auth UI packages installed
- Understanding of Supabase authentication flow
- Knowledge of CSS/Tailwind for styling

## Expected Outcomes
- Complete login/signup form implementation
- Social authentication configured
- Error handling implemented
- Mobile-responsive design
- Ready for app integration

## Next Steps
After completing this task, proceed to Phase 3.1: Progress Hook Implementation