# Phase 3.2: App.tsx Auth Integration

## Task Description
Integrate authentication and progress tracking into the main App.tsx component, transforming the application from a static frontend to a full-stack authenticated experience with persistent user progress.

## Claude Code Prompt

```
I need you to automatically integrate authentication and progress tracking using automated file creation and editing tools. This involves restructuring the app to support authenticated users, protecting the flashcard functionality, and connecting the progress tracking system with the existing UI components.

Please help me with the following:

1. **Automated App.tsx Restructuring:**
   Use the Edit tool to update App.tsx and Write tool to create new components:

   ```typescript
   import React from 'react'
   import { BrowserRouter as Router } from 'react-router-dom'
   import { AuthProvider } from './contexts/AuthContext'
   import { ProtectedRoute } from './components/ProtectedRoute'
   import { FlashCardApp } from './components/FlashCardApp'
   import './styles/auth.css' // Import auth styles

   function App() {
     return (
       <Router>
         <AuthProvider>
           <div className="app">
             <ProtectedRoute>
               <FlashCardApp />
             </ProtectedRoute>
           </div>
         </AuthProvider>
       </Router>
     )
   }

   export default App
   ```

2. **Automated FlashCardApp Component Creation:**
   Use the Write tool to create `src/components/FlashCardApp.tsx` with complete integration:

   ```typescript
   import React, { useState, useEffect } from 'react'
   import { useAuth } from '../contexts/AuthContext'
   import { useProgress } from '../hooks/useProgress'
   import { ModeSelection } from './ModeSelection'
   import { Header } from './Header'
   import { FlashCard } from './FlashCard'
   import { ProgressBar } from './ProgressBar'
   import { Statistics } from './Statistics'
   import { CategoryFilter } from './CategoryFilter'
   import { getAllWords } from '../lib/database'
   import { Word, AppState } from '../types'

   export const FlashCardApp: React.FC = () => {
     const { user, signOut } = useAuth()
     const {
       progress,
       loading: progressLoading,
       updateProgress,
       startSession,
       endSession,
       getStats,
       getDueWords
     } = useProgress()

     // Existing state from original App.tsx
     const [appState, setAppState] = useState<AppState>({
       currentWordIndex: 0,
       userInput: '',
       showAnswer: false,
       progress: {
         correct: 0,
         wrong: 0,
         streak: 0,
         completed: new Set()
       },
       learningDirection: 'ru-it',
       darkMode: localStorage.getItem('darkMode') === 'true',
       shuffleMode: false
     })

     const [words, setWords] = useState<Word[]>([])
     const [loading, setLoading] = useState(true)
     const [showModeSelection, setShowModeSelection] = useState(true)
     const [selectedCategories, setSelectedCategories] = useState<string[]>([])
     const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

     // Load words from database
     useEffect(() => {
       const loadWords = async () => {
         try {
           setLoading(true)
           const wordsData = await getAllWords()
           setWords(wordsData)
         } catch (error) {
           console.error('Error loading words:', error)
         } finally {
           setLoading(false)
         }
       }

       loadWords()
     }, [])

     // Filter words based on categories and due status
     const getFilteredWords = () => {
       let filteredWords = words

       // Filter by categories if any selected
       if (selectedCategories.length > 0) {
         filteredWords = filteredWords.filter(word =>
           selectedCategories.includes(word.category)
         )
       }

       // Get word IDs and filter by due words for spaced repetition
       const wordIds = filteredWords.map(word => word.id)
       const dueWordIds = getDueWords(wordIds)

       return filteredWords.filter(word => dueWordIds.includes(word.id))
     }

     // Start learning session
     const handleStartLearning = async (direction: 'ru-it' | 'it-ru') => {
       const sessionId = await startSession(direction)
       setCurrentSessionId(sessionId)
       setAppState(prev => ({
         ...prev,
         learningDirection: direction
       }))
       setShowModeSelection(false)
     }

     // Handle answer submission with progress tracking
     const handleAnswerSubmission = async (word: Word, userAnswer: string, isCorrect: boolean) => {
       // Update progress in database
       await updateProgress(word.id, isCorrect)

       // Update local app state
       setAppState(prev => ({
         ...prev,
         progress: {
           ...prev.progress,
           correct: prev.progress.correct + (isCorrect ? 1 : 0),
           wrong: prev.progress.wrong + (!isCorrect ? 1 : 0),
           streak: isCorrect ? prev.progress.streak + 1 : 0,
           completed: new Set([...prev.progress.completed, word.id])
         }
       }))
     }

     // End learning session
     const handleEndSession = async () => {
       await endSession()
       setCurrentSessionId(null)
       setShowModeSelection(true)

       // Reset local progress for new session
       setAppState(prev => ({
         ...prev,
         currentWordIndex: 0,
         progress: {
           correct: 0,
           wrong: 0,
           streak: 0,
           completed: new Set()
         }
       }))
     }

     // Handle sign out
     const handleSignOut = async () => {
       await endSession() // End current session before signing out
       await signOut()
     }

     if (loading || progressLoading) {
       return (
         <div className="min-h-screen flex items-center justify-center">
           <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
         </div>
       )
     }

     const filteredWords = getFilteredWords()

     return (
       <div className={`min-h-screen transition-colors duration-200 ${
         appState.darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-purple-50'
       }`}>
         {showModeSelection ? (
           <div className="container mx-auto px-4 py-8">
             {/* User info and stats */}
             <div className="max-w-2xl mx-auto mb-8">
               <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                 <div className="flex justify-between items-center mb-4">
                   <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                     Welcome back, {user?.email}!
                   </h1>
                   <button
                     onClick={handleSignOut}
                     className="px-4 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                   >
                     Sign Out
                   </button>
                 </div>
                 <Statistics />
               </div>
             </div>

             {/* Category filter */}
             <div className="max-w-2xl mx-auto mb-8">
               <CategoryFilter
                 selectedCategories={selectedCategories}
                 onCategoryChange={setSelectedCategories}
               />
             </div>

             {/* Mode selection */}
             <ModeSelection
               onModeSelect={handleStartLearning}
               availableWords={filteredWords.length}
               totalWords={words.length}
             />
           </div>
         ) : (
           <div className="flex h-screen">
             {/* Progress sidebar */}
             <ProgressBar
               currentIndex={appState.currentWordIndex}
               totalWords={filteredWords.length}
               progress={appState.progress}
               onEndSession={handleEndSession}
             />

             {/* Main content */}
             <div className="flex-1 flex flex-col">
               <Header
                 darkMode={appState.darkMode}
                 toggleDarkMode={() => setAppState(prev => ({
                   ...prev,
                   darkMode: !prev.darkMode
                 }))}
                 shuffleMode={appState.shuffleMode}
                 toggleShuffle={() => setAppState(prev => ({
                   ...prev,
                   shuffleMode: !prev.shuffleMode
                 }))}
                 learningDirection={appState.learningDirection}
                 toggleDirection={() => setAppState(prev => ({
                   ...prev,
                   learningDirection: prev.learningDirection === 'ru-it' ? 'it-ru' : 'ru-it'
                 }))}
                 onRestart={handleEndSession}
               />

               {filteredWords.length > 0 ? (
                 <FlashCard
                   word={filteredWords[appState.currentWordIndex]}
                   userInput={appState.userInput}
                   showAnswer={appState.showAnswer}
                   learningDirection={appState.learningDirection}
                   onInputChange={(input) => setAppState(prev => ({ ...prev, userInput: input }))}
                   onSubmit={handleAnswerSubmission}
                   onNext={() => {
                     const nextIndex = (appState.currentWordIndex + 1) % filteredWords.length
                     setAppState(prev => ({
                       ...prev,
                       currentWordIndex: nextIndex,
                       userInput: '',
                       showAnswer: false
                     }))
                   }}
                   progress={progress.get(filteredWords[appState.currentWordIndex]?.id)}
                 />
               ) : (
                 <div className="flex-1 flex items-center justify-center">
                   <div className="text-center">
                     <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                       No words available
                     </h2>
                     <p className="text-gray-600 dark:text-gray-300 mb-6">
                       All words in the selected categories are up to date!
                     </p>
                     <button
                       onClick={handleEndSession}
                       className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                     >
                       Back to Categories
                     </button>
                   </div>
                 </div>
               )}
             </div>
           </div>
         )}
       </div>
     )
   }
   ```

3. **Update Existing Components:**
   Modify existing components to work with the new progress system:

   - Update FlashCard component to display mastery level
   - Modify ProgressBar to show database progress
   - Update Header with user info and sign out option
   - Enhance ModeSelection with progress statistics

4. **Add Error Boundaries:**
   Create error boundaries for better error handling:

   ```typescript
   // src/components/ErrorBoundary.tsx
   import React from 'react'

   interface ErrorBoundaryState {
     hasError: boolean
     error?: Error
   }

   export class ErrorBoundary extends React.Component<
     { children: React.ReactNode },
     ErrorBoundaryState
   > {
     constructor(props: { children: React.ReactNode }) {
       super(props)
       this.state = { hasError: false }
     }

     static getDerivedStateFromError(error: Error): ErrorBoundaryState {
       return { hasError: true, error }
     }

     componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
       console.error('Application error:', error, errorInfo)
     }

     render() {
       if (this.state.hasError) {
         return (
           <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900">
             <div className="text-center">
               <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
               <p className="text-red-500 mb-4">
                 {this.state.error?.message || 'An unexpected error occurred'}
               </p>
               <button
                 onClick={() => window.location.reload()}
                 className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
               >
                 Reload Page
               </button>
             </div>
           </div>
         )
       }

       return this.props.children
     }
   }
   ```

5. **Update main.tsx:**
   Wrap the app with error boundary:

   ```typescript
   import React from 'react'
   import ReactDOM from 'react-dom/client'
   import App from './App.tsx'
   import { ErrorBoundary } from './components/ErrorBoundary'
   import './index.css'

   ReactDOM.createRoot(document.getElementById('root')!).render(
     <React.StrictMode>
       <ErrorBoundary>
         <App />
       </ErrorBoundary>
     </React.StrictMode>,
   )
   ```

6. **Handle Data Loading States:**
   Implement proper loading and error states throughout the application

7. **Update Vite Configuration:**
   Ensure proper environment variable handling and routing support

8. **Testing Integration:**
   Help me test the complete authentication and progress flow:
   - User registration/login
   - Progress tracking functionality
   - Session management
   - Category filtering with spaced repetition
   - Error handling scenarios

**Important**: Use Write and Edit tools for ALL file modifications. Integrate with Supabase MCP server for database operations. Generate complete, production-ready code with error handling, loading states, and proper component structure.

**Expected Outcome**: Complete authentication and progress integration with automated file generation, MCP database integration, and seamless user experience.
```

## Prerequisites
- Completed Phase 3.1 (Progress Hook implementation)
- Understanding of React component architecture
- Knowledge of authentication flows
- Experience with state management

## Expected Outcomes
- Fully integrated authentication system
- Progress tracking working with UI
- Session management implemented
- Error handling in place
- Complete authenticated learning experience

## Next Steps
After completing this task, proceed to Phase 4.1: Vercel Configuration