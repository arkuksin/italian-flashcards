# Phase 2.4: Auth Context Implementation

## Task Description
Create a React Context for managing authentication state throughout the application, providing user session management and authentication utilities.

## Claude Code Prompt

```
I need you to automatically implement a React Context for authentication management using the Write tool to create all necessary files. This context should handle user session state, authentication events, and provide a clean API for auth operations throughout the app.

Please help me with the following:

1. **Automated Auth Context Creation:**
   Use the Write tool to create `src/contexts/AuthContext.tsx` with complete implementation:

   ```typescript
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
   }

   const AuthContext = createContext<AuthContextType | undefined>(undefined)

   export const useAuth = () => {
     const context = useContext(AuthContext)
     if (!context) {
       throw new Error('useAuth must be used within an AuthProvider')
     }
     return context
   }
   ```

2. **Implement AuthProvider Component:**
   Create a comprehensive provider with session management:

   ```typescript
   export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
     const [user, setUser] = useState<User | null>(null)
     const [session, setSession] = useState<Session | null>(null)
     const [loading, setLoading] = useState(true)

     useEffect(() => {
       // Get initial session
       const getInitialSession = async () => {
         const { data: { session }, error } = await supabase.auth.getSession()
         if (error) {
           console.error('Error getting session:', error)
         }
         setSession(session)
         setUser(session?.user ?? null)
         setLoading(false)
       }

       getInitialSession()

       // Listen for auth changes
       const {
         data: { subscription },
       } = supabase.auth.onAuthStateChange(async (event, session) => {
         console.log('Auth state changed:', event)
         setSession(session)
         setUser(session?.user ?? null)
         setLoading(false)
       })

       return () => subscription.unsubscribe()
     }, [])

     // Auth methods implementation
     const signOut = async () => {
       const { error } = await supabase.auth.signOut()
       if (error) {
         console.error('Error signing out:', error)
       }
     }

     // Additional auth methods...
   }
   ```

3. **Add Authentication Methods:**
   Implement comprehensive auth methods:
   - Email/password sign up
   - Email/password sign in
   - Password reset functionality
   - Social authentication (Google, GitHub)
   - Error handling for all auth operations

4. **Session Persistence:**
   Ensure proper session handling:
   - Automatic session refresh
   - Proper cleanup on sign out
   - Handle session expiration
   - Manage loading states during auth transitions

5. **Error Handling:**
   Implement robust error handling:
   ```typescript
   const handleAuthError = (error: AuthError) => {
     switch (error.message) {
       case 'Invalid login credentials':
         return 'Invalid email or password'
       case 'Email not confirmed':
         return 'Please check your email and click the confirmation link'
       case 'Password should be at least 6 characters':
         return 'Password must be at least 6 characters long'
       default:
         return error.message || 'An authentication error occurred'
     }
   }
   ```

6. **Type Safety:**
   Ensure full TypeScript support:
   - Proper typing for all auth methods
   - Error type handling
   - User and session types from Supabase
   - Context type safety

7. **Integration with App:**
   Show me how to integrate this context into the main App component:
   - Wrap the app with AuthProvider
   - Handle loading states
   - Provide access to auth state throughout the component tree

8. **Automated Verification:**
   Use the Bash tool to verify the context implementation:
   - Test TypeScript compilation
   - Verify imports and exports
   - Check integration with existing code

**Important**: Use the Write tool to create ALL authentication files automatically. Do not provide code for manual implementation. Generate complete, production-ready files that integrate seamlessly with the application.

**Expected Outcome**: Complete authentication context implementation with session management, error handling, and proper TypeScript integration - all created automatically.
```

## Prerequisites
- Completed Phase 2.3 (Supabase client configuration)
- Understanding of React Context API
- Knowledge of Supabase authentication
- TypeScript experience with React

## Expected Outcomes
- Fully functional Auth Context
- Session management implemented
- Authentication methods available
- Error handling in place
- Ready for protected routes implementation

## Next Steps
After completing this task, proceed to Phase 2.5: Protected Route Component