# Phase 2.5: Protected Route Component

## Task Description
Create a Protected Route component that manages access control to the application, ensuring only authenticated users can access the flashcard functionality while providing a seamless login experience for unauthenticated users.

## Claude Code Prompt

```
I need you to automatically create a Protected Route component using the Write tool to generate all necessary files. This component should control access to the main application features, redirecting unauthenticated users to a login form while providing a smooth user experience with loading states.

Please help me with the following:

1. **Automated ProtectedRoute Creation:**
   Use the Write tool to create `src/components/ProtectedRoute.tsx`:

   ```typescript
   import React from 'react'
   import { useAuth } from '../contexts/AuthContext'
   import { LoginForm } from './auth/LoginForm'
   import { LoadingSpinner } from './ui/LoadingSpinner'

   interface ProtectedRouteProps {
     children: React.ReactNode
   }

   export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
     const { user, loading } = useAuth()

     // Show loading spinner while checking authentication
     if (loading) {
       return (
         <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
           <LoadingSpinner size="large" message="Loading..." />
         </div>
       )
     }

     // Show login form if user is not authenticated
     if (!user) {
       return <LoginForm />
     }

     // Render protected content for authenticated users
     return <>{children}</>
   }
   ```

2. **Automated Loading Spinner Creation:**
   Use the Write tool to create `src/components/ui/LoadingSpinner.tsx`:

   ```typescript
   import React from 'react'

   interface LoadingSpinnerProps {
     size?: 'small' | 'medium' | 'large'
     message?: string
     className?: string
   }

   export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
     size = 'medium',
     message,
     className = ''
   }) => {
     const sizeClasses = {
       small: 'w-4 h-4',
       medium: 'w-8 h-8',
       large: 'w-12 h-12'
     }

     return (
       <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
         <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
         {message && (
           <p className="text-gray-600 dark:text-gray-300 text-sm animate-pulse">
             {message}
           </p>
         )}
       </div>
     )
   }
   ```

3. **Route Protection Logic:**
   Implement sophisticated route protection:
   - Handle different authentication states (loading, authenticated, unauthenticated)
   - Smooth transitions between states
   - Remember intended destination after login
   - Handle authentication errors gracefully

4. **User Experience Enhancements:**
   ```typescript
   // Enhanced ProtectedRoute with session restoration
   export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
     const { user, loading, session } = useAuth()
     const [authChecked, setAuthChecked] = useState(false)

     useEffect(() => {
       // Mark auth as checked after initial load
       if (!loading) {
         setAuthChecked(true)
       }
     }, [loading])

     // Show initial loading
     if (!authChecked) {
       return <LoadingSpinner size="large" message="Checking authentication..." />
     }

     // Session expired handling
     if (session && session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
       return <LoginForm message="Your session has expired. Please sign in again." />
     }

     // Not authenticated
     if (!user) {
       return <LoginForm />
     }

     return <>{children}</>
   }
   ```

5. **Integration with React Router:**
   Show me how to integrate with routing if needed:
   ```typescript
   import { useLocation, Navigate } from 'react-router-dom'

   export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
     const { user, loading } = useAuth()
     const location = useLocation()

     if (loading) {
       return <LoadingSpinner size="large" message="Loading..." />
     }

     if (!user) {
       // Save the attempted location for post-login redirect
       return <Navigate to="/login" state={%raw%}{{ from: location }}{%endraw%} replace />
     }

     return <>{children}</>
   }
   ```

6. **Error Boundary Integration:**
   Add error handling for auth-related errors:
   ```typescript
   import { ErrorBoundary } from 'react-error-boundary'

   const AuthErrorFallback = ({ error, resetErrorBoundary }: any) => (
     <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900">
       <div className="text-center">
         <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h2>
         <p className="text-red-500 mb-4">{error.message}</p>
         <button
           onClick={resetErrorBoundary}
           className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
         >
           Try Again
         </button>
       </div>
     </div>
   )
   ```

7. **Performance Optimization:**
   - Minimize re-renders during auth state changes
   - Efficient loading state management
   - Proper component memoization where needed

8. **Accessibility Considerations:**
   - Proper ARIA labels for loading states
   - Screen reader announcements for auth state changes
   - Keyboard navigation support

**Important**: Use the Write tool to create ALL component files automatically. Generate complete, production-ready components with proper TypeScript types, error handling, and responsive design.

**Expected Outcome**: Complete protected route system with loading states and error handling - all files created automatically using available tools.
```

## Prerequisites
- Completed Phase 2.4 (Auth Context implementation)
- Understanding of conditional rendering in React
- Knowledge of React Router (if using routing)
- Understanding of accessibility best practices

## Expected Outcomes
- Functional Protected Route component
- Smooth authentication flow
- Proper loading states
- Error handling implemented
- Ready for login form integration

## Next Steps
After completing this task, proceed to Phase 2.6: Login/Signup Components