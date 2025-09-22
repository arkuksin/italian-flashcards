# Phase 5.1: Spaced Repetition System

## Task Description
Implement an advanced spaced repetition system based on the Leitner method and SM-2 algorithm to optimize learning efficiency by presenting words at calculated intervals based on user performance and memory retention patterns.

## Claude Code Prompt

```
I need you to automatically implement a sophisticated spaced repetition system using the Write tool to create all algorithm files and integrate with Supabase MCP server. This should go beyond the basic progress tracking and implement scientific learning algorithms to optimize memory retention and learning efficiency.

Please help me with the following:

1. **Automated Algorithm Implementation:**
   Use the Write tool to create `src/utils/spaced-repetition-advanced.ts`:

   ```typescript
   import { WordProgress } from '../types'

   export interface SpacedRepetitionCard {
     wordId: number
     easeFactor: number // SM-2 algorithm ease factor (1.3 - 2.5)
     interval: number // Days until next review
     repetitions: number // Number of successful repetitions
     nextReviewDate: Date
     lastReviewDate?: Date
     difficulty: number // 0-5 scale
   }

   export interface ReviewSession {
     wordId: number
     quality: number // 0-5 quality of recall (SM-2)
     responseTime: number // milliseconds
     wasCorrect: boolean
     reviewDate: Date
   }

   // SM-2 Algorithm Implementation
   export class SM2Algorithm {
     static calculateNextReview(
       card: SpacedRepetitionCard,
       quality: number // 0-5 (0=complete blackout, 5=perfect response)
     ): SpacedRepetitionCard {
       const newCard = { ...card }

       if (quality < 3) {
         // Incorrect response - reset repetitions
         newCard.repetitions = 0
         newCard.interval = 1
       } else {
         // Correct response
         if (newCard.repetitions === 0) {
           newCard.interval = 1
         } else if (newCard.repetitions === 1) {
           newCard.interval = 6
         } else {
           newCard.interval = Math.round(newCard.interval * newCard.easeFactor)
         }
         newCard.repetitions += 1
       }

       // Update ease factor
       newCard.easeFactor = newCard.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

       // Ensure ease factor stays within bounds
       if (newCard.easeFactor < 1.3) {
         newCard.easeFactor = 1.3
       }

       // Calculate next review date
       newCard.nextReviewDate = new Date()
       newCard.nextReviewDate.setDate(newCard.nextReviewDate.getDate() + newCard.interval)
       newCard.lastReviewDate = new Date()

       return newCard
     }

     static getQualityFromResponse(
       correct: boolean,
       responseTime: number,
       expectedTime: number = 3000
     ): number {
       if (!correct) {
         return Math.random() < 0.5 ? 0 : 1 // Random between complete failure and partial recall
       }

       // Quality based on response time for correct answers
       const timeRatio = responseTime / expectedTime

       if (timeRatio <= 0.5) return 5 // Perfect response (fast)
       if (timeRatio <= 1.0) return 4 // Good response
       if (timeRatio <= 1.5) return 3 // Satisfactory response
       return 2 // Hesitant response (slow but correct)
     }
   }

   // Leitner Box System
   export class LeitnerSystem {
     private static readonly INTERVALS = [1, 3, 7, 14, 30, 90, 180] // Days for each box

     static getLeitnerBox(correctCount: number, wrongCount: number): number {
       const totalAttempts = correctCount + wrongCount
       if (totalAttempts === 0) return 0

       const successRate = correctCount / totalAttempts

       // Determine box based on success rate and total attempts
       if (successRate >= 0.9 && totalAttempts >= 10) return 6
       if (successRate >= 0.85 && totalAttempts >= 8) return 5
       if (successRate >= 0.8 && totalAttempts >= 6) return 4
       if (successRate >= 0.7 && totalAttempts >= 4) return 3
       if (successRate >= 0.6 && totalAttempts >= 3) return 2
       if (totalAttempts >= 2) return 1
       return 0
     }

     static getNextReviewInterval(box: number): number {
       return this.INTERVALS[Math.min(box, this.INTERVALS.length - 1)]
     }

     static shouldReview(
       lastReviewDate: Date,
       box: number,
       forgettingCurve: number = 1.0
     ): boolean {
       const interval = this.getNextReviewInterval(box)
       const adjustedInterval = Math.round(interval * forgettingCurve)

       const nextReviewDate = new Date(lastReviewDate)
       nextReviewDate.setDate(nextReviewDate.getDate() + adjustedInterval)

       return new Date() >= nextReviewDate
     }
   }

   // Forgetting Curve Model
   export class ForgettingCurve {
     static calculateRetention(
       daysSinceReview: number,
       difficulty: number,
       repetitions: number
     ): number {
       // Simplified forgetting curve: R(t) = e^(-t/S)
       // where S is the stability factor
       const stabilityFactor = Math.max(1, repetitions) * (5 - difficulty)
       return Math.exp(-daysSinceReview / stabilityFactor)
     }

     static getDifficultyFromPerformance(
       correctCount: number,
       wrongCount: number,
       averageResponseTime: number
     ): number {
       const totalAttempts = correctCount + wrongCount
       if (totalAttempts === 0) return 3 // Default difficulty

       const errorRate = wrongCount / totalAttempts
       const timeScore = Math.min(averageResponseTime / 3000, 2) // Normalize to 0-2

       // Combine error rate and response time for difficulty (0-5 scale)
       return Math.min(5, Math.round((errorRate * 3) + (timeScore * 2)))
     }
   }
   ```

2. **Advanced Progress Hook Extension:**
   Extend `src/hooks/useProgress.ts` with spaced repetition features:

   ```typescript
   import { SM2Algorithm, LeitnerSystem, ForgettingCurve } from '../utils/spaced-repetition-advanced'

   // Add to existing useProgress hook
   export const useAdvancedProgress = () => {
     const baseProgress = useProgress()
     const [reviewQueue, setReviewQueue] = useState<number[]>([])
     const [sessionData, setSessionData] = useState<Map<number, ReviewSession>>(new Map())

     // Get optimized review queue using spaced repetition
     const getOptimizedReviewQueue = useCallback((allWordIds: number[]): number[] => {
       const now = new Date()
       const dueWords: Array<{ wordId: number, priority: number }> = []

       allWordIds.forEach(wordId => {
         const progress = baseProgress.progress.get(wordId)

         if (!progress) {
           // New words have highest priority
           dueWords.push({ wordId, priority: 1000 })
           return
         }

         const leitnerBox = LeitnerSystem.getLeitnerBox(
           progress.correct_count,
           progress.wrong_count
         )

         const lastReviewDate = new Date(progress.last_practiced)
         const shouldReview = LeitnerSystem.shouldReview(lastReviewDate, leitnerBox)

         if (shouldReview) {
           // Calculate priority based on forgetting curve
           const daysSinceReview = Math.floor(
             (now.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24)
           )

           const difficulty = ForgettingCurve.getDifficultyFromPerformance(
             progress.correct_count,
             progress.wrong_count,
             3000 // Average expected response time
           )

           const retention = ForgettingCurve.calculateRetention(
             daysSinceReview,
             difficulty,
             progress.correct_count
           )

           // Lower retention = higher priority
           const priority = Math.round((1 - retention) * 100)
           dueWords.push({ wordId, priority })
         }
       })

       // Sort by priority (highest first) and return word IDs
       return dueWords
         .sort((a, b) => b.priority - a.priority)
         .map(item => item.wordId)
     }, [baseProgress.progress])

     // Enhanced progress update with spaced repetition
     const updateAdvancedProgress = useCallback(async (
       wordId: number,
       correct: boolean,
       responseTime: number
     ) => {
       // Get current session data
       const currentSession = sessionData.get(wordId) || {
         wordId,
         quality: 0,
         responseTime,
         wasCorrect: correct,
         reviewDate: new Date()
       }

       // Calculate quality score using SM-2 algorithm
       const quality = SM2Algorithm.getQualityFromResponse(correct, responseTime)

       // Update session data
       const updatedSession: ReviewSession = {
         ...currentSession,
         quality,
         responseTime,
         wasCorrect: correct,
         reviewDate: new Date()
       }

       setSessionData(prev => new Map(prev).set(wordId, updatedSession))

       // Update base progress
       await baseProgress.updateProgress(wordId, correct)

       // You might want to store additional spaced repetition data
       // in a separate table for more advanced analytics
     }, [baseProgress.updateProgress, sessionData])

     // Get study recommendations
     const getStudyRecommendations = useCallback(() => {
       const progress = Array.from(baseProgress.progress.values())

       const recommendations = {
         newWords: 0,
         reviewWords: 0,
         difficultWords: 0,
         masteredWords: 0,
         suggestedSessionLength: 0
       }

       progress.forEach(p => {
         const leitnerBox = LeitnerSystem.getLeitnerBox(p.correct_count, p.wrong_count)
         const difficulty = ForgettingCurve.getDifficultyFromPerformance(
           p.correct_count,
           p.wrong_count,
           3000
         )

         if (p.correct_count === 0 && p.wrong_count === 0) {
           recommendations.newWords++
         } else if (leitnerBox >= 5) {
           recommendations.masteredWords++
         } else if (difficulty >= 4) {
           recommendations.difficultWords++
         } else {
           recommendations.reviewWords++
         }
       })

       // Suggest session length based on due words
       const dueWords = getOptimizedReviewQueue(
         Array.from(baseProgress.progress.keys())
       ).length

       recommendations.suggestedSessionLength = Math.min(20, Math.max(5, dueWords))

       return recommendations
     }, [baseProgress.progress, getOptimizedReviewQueue])

     return {
       ...baseProgress,
       getOptimizedReviewQueue,
       updateAdvancedProgress,
       getStudyRecommendations,
       sessionData
     }
   }
   ```

3. **Study Session Optimizer:**
   Create `src/components/StudySessionOptimizer.tsx`:

   ```typescript
   import React, { useState, useEffect } from 'react'
   import { useAdvancedProgress } from '../hooks/useProgress'

   export const StudySessionOptimizer: React.FC = () => {
     const { getStudyRecommendations, getOptimizedReviewQueue } = useAdvancedProgress()
     const [recommendations, setRecommendations] = useState(getStudyRecommendations())

     useEffect(() => {
       setRecommendations(getStudyRecommendations())
     }, [getStudyRecommendations])

     return (
       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
         <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
           Study Recommendations
         </h2>

         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
           <div className="text-center">
             <div className="text-2xl font-bold text-blue-600">
               {recommendations.newWords}
             </div>
             <div className="text-sm text-gray-600 dark:text-gray-300">
               New Words
             </div>
           </div>

           <div className="text-center">
             <div className="text-2xl font-bold text-yellow-600">
               {recommendations.reviewWords}
             </div>
             <div className="text-sm text-gray-600 dark:text-gray-300">
               Ready for Review
             </div>
           </div>

           <div className="text-center">
             <div className="text-2xl font-bold text-red-600">
               {recommendations.difficultWords}
             </div>
             <div className="text-sm text-gray-600 dark:text-gray-300">
               Difficult Words
             </div>
           </div>

           <div className="text-center">
             <div className="text-2xl font-bold text-green-600">
               {recommendations.masteredWords}
             </div>
             <div className="text-sm text-gray-600 dark:text-gray-300">
               Mastered Words
             </div>
           </div>
         </div>

         <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
           <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
             Optimal Session Length
           </h3>
           <p className="text-blue-700 dark:text-blue-200">
             We recommend studying {recommendations.suggestedSessionLength} words
             in your next session for optimal retention.
           </p>
         </div>
       </div>
     )
   }
   ```

4. **Learning Analytics Dashboard:**
   Create detailed analytics for learning patterns and progress visualization

5. **Adaptive Difficulty System:**
   Implement dynamic difficulty adjustment based on user performance

6. **Performance Metrics:**
   Track detailed learning metrics including retention rates, optimal review intervals, and learning velocity

**Important**: Use Write and Edit tools to create ALL algorithm files automatically. Integrate with Supabase MCP server for progress data operations. Generate complete implementations with scientific algorithms and database integration.

**Expected Outcome**: Complete advanced spaced repetition system with SM-2 algorithm, Leitner system, and automated database operations via MCP server.
```

## Prerequisites
- Completed Phase 4.3 (Deployment Checklist)
- Understanding of spaced repetition algorithms
- Knowledge of memory research principles
- Experience with advanced React patterns

## Expected Outcomes
- Scientific spaced repetition algorithm implemented
- SM-2 and Leitner system integration
- Optimized learning recommendations
- Advanced progress analytics
- Significantly improved learning efficiency

## Next Steps
After completing this task, proceed to Phase 5.2: Statistics Dashboard