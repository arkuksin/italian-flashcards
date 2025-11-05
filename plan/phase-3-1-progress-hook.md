# Phase 3.1: Progress Hook Implementation

## Task Description
Create a comprehensive React hook for managing user progress tracking, implementing the Leitner spaced repetition system, and providing real-time progress updates with the Supabase database.

## Claude Code Prompt

```
I need you to automatically implement a progress tracking hook using the Write tool to create all necessary files. This hook should manage user progress, implement Leitner spaced repetition, and integrate with Supabase MCP server for database operations.

Please help me with the following:

1. **Automated Progress Types Creation:**
   Use the Edit tool to update `src/types/index.ts` and Write tool for additional type files:

   ```typescript
   export interface WordProgress {
     id: string
     user_id: string
     word_id: number
     correct_count: number
     wrong_count: number
     last_practiced: string
     mastery_level: number // 0-5 (Leitner System levels)
   }

   export interface LearningSession {
     id: string
     user_id: string
     started_at: string
     ended_at: string | null
     words_studied: number
     correct_answers: number
     learning_direction: 'ru-it' | 'it-ru'
   }

   export interface ProgressStats {
     totalWordsStudied: number
     totalAttempts: number
     correctAnswers: number
     accuracy: number
     currentStreak: number
     longestStreak: number
     masteredWords: number
     wordsInProgress: number
   }
   ```

2. **Automated useProgress Hook Creation:**
   Use the Write tool to create `src/hooks/useProgress.ts` with complete implementation:

   ```typescript
   import { useState, useEffect, useCallback } from 'react'
   import { supabase } from '../lib/supabase'
   import { useAuth } from '../contexts/AuthContext'
   import { WordProgress, ProgressStats } from '../types'

   export const useProgress = () => {
     const { user } = useAuth()
     const [progress, setProgress] = useState<Map<number, WordProgress>>(new Map())
     const [loading, setLoading] = useState(true)
     const [currentSession, setCurrentSession] = useState<string | null>(null)
     const [sessionStats, setSessionStats] = useState({
       wordsStudied: 0,
       correctAnswers: 0
     })

     // Load user progress from database
     const loadProgress = useCallback(async () => {
       if (!user) {
         setLoading(false)
         return
       }

       try {
         const { data, error } = await supabase
           .from('user_progress')
           .select('*')
           .eq('user_id', user.id)

         if (error) throw error

         const progressMap = new Map<number, WordProgress>()
         data?.forEach(item => {
           progressMap.set(item.word_id, item)
         })

         setProgress(progressMap)
       } catch (error) {
         console.error('Error loading progress:', error)
       } finally {
         setLoading(false)
       }
     }, [user])

     // Load progress when user changes
     useEffect(() => {
       loadProgress()
     }, [loadProgress])

     // Start a new learning session
     const startSession = useCallback(async (learningDirection: 'ru-it' | 'it-ru') => {
       if (!user) return null

       try {
         const { data, error } = await supabase
           .from('learning_sessions')
           .insert({
             user_id: user.id,
             learning_direction: learningDirection,
             started_at: new Date().toISOString()
           })
           .select()
           .single()

         if (error) throw error

         setCurrentSession(data.id)
         setSessionStats({ wordsStudied: 0, correctAnswers: 0 })
         return data.id
       } catch (error) {
         console.error('Error starting session:', error)
         return null
       }
     }, [user])

     // End current learning session
     const endSession = useCallback(async () => {
       if (!currentSession || !user) return

       try {
         const { error } = await supabase
           .from('learning_sessions')
           .update({
             ended_at: new Date().toISOString(),
             words_studied: sessionStats.wordsStudied,
             correct_answers: sessionStats.correctAnswers
           })
           .eq('id', currentSession)

         if (error) throw error

         setCurrentSession(null)
         setSessionStats({ wordsStudied: 0, correctAnswers: 0 })
       } catch (error) {
         console.error('Error ending session:', error)
       }
     }, [currentSession, sessionStats, user])

     // Update progress for a specific word
     const updateProgress = useCallback(async (wordId: number, correct: boolean) => {
       if (!user) return

       const currentProgress = progress.get(wordId)
       const newCorrectCount = currentProgress ?
         (correct ? currentProgress.correct_count + 1 : currentProgress.correct_count) :
         (correct ? 1 : 0)

       const newWrongCount = currentProgress ?
         (!correct ? currentProgress.wrong_count + 1 : currentProgress.wrong_count) :
         (!correct ? 1 : 0)

       // Calculate mastery level using Leitner System
       const totalAttempts = newCorrectCount + newWrongCount
       const successRate = totalAttempts > 0 ? newCorrectCount / totalAttempts : 0

       let masteryLevel = 0
       if (successRate >= 0.9 && totalAttempts >= 5) masteryLevel = 5
       else if (successRate >= 0.8 && totalAttempts >= 4) masteryLevel = 4
       else if (successRate >= 0.7 && totalAttempts >= 3) masteryLevel = 3
       else if (successRate >= 0.6 && totalAttempts >= 2) masteryLevel = 2
       else if (totalAttempts >= 1) masteryLevel = 1

       const updatedProgress: WordProgress = {
         id: currentProgress?.id || '',
         user_id: user.id,
         word_id: wordId,
         correct_count: newCorrectCount,
         wrong_count: newWrongCount,
         mastery_level: masteryLevel,
         last_practiced: new Date().toISOString()
       }

       try {
         const { data, error } = await supabase
           .from('user_progress')
           .upsert(updatedProgress, {
             onConflict: 'user_id,word_id'
           })
           .select()
           .single()

         if (error) throw error

         // Update local state
         const newProgress = new Map(progress)
         newProgress.set(wordId, data)
         setProgress(newProgress)

         // Update session stats
         setSessionStats(prev => ({
           wordsStudied: prev.wordsStudied + 1,
           correctAnswers: prev.correctAnswers + (correct ? 1 : 0)
         }))

       } catch (error) {
         console.error('Error updating progress:', error)
       }
     }, [user, progress])

     // Calculate overall statistics
     const getStats = useCallback((): ProgressStats => {
       const progressArray = Array.from(progress.values())

       const totalWordsStudied = progressArray.length
       const totalAttempts = progressArray.reduce((sum, p) => sum + p.correct_count + p.wrong_count, 0)
       const correctAnswers = progressArray.reduce((sum, p) => sum + p.correct_count, 0)
       const accuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0

       // Calculate current streak (consecutive correct answers)
       const recentProgress = progressArray
         .sort((a, b) => new Date(b.last_practiced).getTime() - new Date(a.last_practiced).getTime())
         .slice(0, 10) // Last 10 practiced words

       let currentStreak = 0
       for (const p of recentProgress) {
         if (p.correct_count > p.wrong_count) {
           currentStreak++
         } else {
           break
         }
       }

       const masteredWords = progressArray.filter(p => p.mastery_level >= 4).length
       const wordsInProgress = progressArray.filter(p => p.mastery_level > 0 && p.mastery_level < 4).length

       return {
         totalWordsStudied,
         totalAttempts,
         correctAnswers,
         accuracy,
         currentStreak,
         longestStreak: currentStreak, // Simplified for now
         masteredWords,
         wordsInProgress
       }
     }, [progress])

     // Get words due for review (spaced repetition)
     const getDueWords = useCallback((allWords: number[]): number[] => {
       const now = new Date()
       const dueWords: number[] = []

       allWords.forEach(wordId => {
         const wordProgress = progress.get(wordId)

         if (!wordProgress) {
           // New words are always due
           dueWords.push(wordId)
           return
         }

         // Calculate next review date based on mastery level
         const intervals = [1, 3, 7, 14, 30, 90] // days
         const interval = intervals[Math.min(wordProgress.mastery_level, intervals.length - 1)]

         const lastPracticed = new Date(wordProgress.last_practiced)
         const nextReview = new Date(lastPracticed)
         nextReview.setDate(nextReview.getDate() + interval)

         if (nextReview <= now) {
           dueWords.push(wordId)
         }
       })

       return dueWords
     }, [progress])

     return {
       progress,
       loading,
       currentSession,
       sessionStats,
       loadProgress,
       updateProgress,
       startSession,
       endSession,
       getStats,
       getDueWords,
       refreshProgress: loadProgress
     }
   }
   ```

3. **Add Spaced Repetition Utilities:**
   Create `src/utils/spacedRepetition.ts`:

   ```typescript
   import { WordProgress } from '../types'

   export const getNextReviewDate = (masteryLevel: number, lastReviewed: Date): Date => {
     const intervals = [1, 3, 7, 14, 30, 90] // days
     const interval = intervals[Math.min(masteryLevel, intervals.length - 1)]

     const nextReview = new Date(lastReviewed)
     nextReview.setDate(nextReview.getDate() + interval)

     return nextReview
   }

   export const isWordDue = (wordProgress: WordProgress | undefined): boolean => {
     if (!wordProgress) return true // New words are always due

     const now = new Date()
     const nextReview = getNextReviewDate(
       wordProgress.mastery_level,
       new Date(wordProgress.last_practiced)
     )

     return nextReview <= now
   }

   export const sortWordsByPriority = (
     wordIds: number[],
     progressMap: Map<number, WordProgress>
   ): number[] => {
     return wordIds.sort((a, b) => {
       const progressA = progressMap.get(a)
       const progressB = progressMap.get(b)

       // New words have highest priority
       if (!progressA && !progressB) return 0
       if (!progressA) return -1
       if (!progressB) return 1

       // Words with lower mastery level have higher priority
       if (progressA.mastery_level !== progressB.mastery_level) {
         return progressA.mastery_level - progressB.mastery_level
       }

       // Among same mastery level, older reviews have priority
       return new Date(progressA.last_practiced).getTime() - new Date(progressB.last_practiced).getTime()
     })
   }
   ```

4. **Error Handling and Offline Support:**
   Add robust error handling and basic offline capabilities

5. **Performance Optimization:**
   Implement memoization and efficient state updates

6. **Integration Testing:**
   Help me test the hook with the existing application components

**Important**: Use Write and Edit tools to create ALL progress tracking files automatically. Use Supabase MCP server for all database operations instead of manual Supabase client calls. Generate complete implementations with error handling and TypeScript types.

**Expected Outcome**: Complete progress tracking system with automated database operations via MCP server, spaced repetition algorithms, and session management.
```

## Prerequisites
- Completed Phase 2.6 (Login/Signup components)
- Understanding of React hooks
- Knowledge of Supabase database operations
- Understanding of spaced repetition algorithms

## Expected Outcomes
- Comprehensive progress tracking hook
- Leitner spaced repetition system implemented
- Real-time progress updates
- Session management functionality
- Ready for app integration

## Next Steps
After completing this task, proceed to Phase 3.2: App.tsx Auth Integration