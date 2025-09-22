# Phase 5.2: Statistics Dashboard

## Task Description
Create a comprehensive statistics dashboard that provides detailed insights into learning progress, performance analytics, and personalized learning recommendations using data visualization and advanced metrics.

## Claude Code Prompt

```
I need you to automatically create a comprehensive statistics dashboard using the Write tool to generate all analytics files and integrate with Supabase MCP server. This dashboard should provide detailed insights into learning progress, performance analytics, streak tracking, and personalized recommendations using beautiful data visualizations.

Please help me with the following:

1. **Statistics Data Types:**
   First, create comprehensive types in `src/types/statistics.ts`:

   ```typescript
   export interface LearningStatistics {
     // Overall Progress
     totalWordsStudied: number
     totalAttempts: number
     correctAnswers: number
     wrongAnswers: number
     accuracy: number

     // Streaks and Consistency
     currentStreak: number
     longestStreak: number
     studyDaysThisWeek: number
     studyDaysThisMonth: number
     consecutiveStudyDays: number

     // Mastery Levels
     masteredWords: number // Level 4-5
     almostMasteredWords: number // Level 3
     learningWords: number // Level 1-2
     newWords: number // Level 0

     // Time-based Analytics
     averageSessionLength: number // minutes
     totalStudyTime: number // minutes
     averageResponseTime: number // milliseconds
     studyTimeToday: number
     studyTimeThisWeek: number
     studyTimeThisMonth: number

     // Performance Trends
     dailyProgress: DailyProgress[]
     weeklyProgress: WeeklyProgress[]
     monthlyProgress: MonthlyProgress[]
     categoryPerformance: CategoryPerformance[]

     // Learning Efficiency
     wordsLearnedPerHour: number
     retentionRate: number
     improvementRate: number

     // Predictions and Goals
     estimatedTimeToMastery: number // days
     recommendedDailyGoal: number // words
     projectedMasteryDate: Date
   }

   export interface DailyProgress {
     date: string
     wordsStudied: number
     correctAnswers: number
     wrongAnswers: number
     studyTime: number
     newWordsLearned: number
     averageResponseTime: number
   }

   export interface WeeklyProgress {
     weekStart: string
     totalWords: number
     accuracy: number
     studyTime: number
     consistency: number // days studied out of 7
   }

   export interface MonthlyProgress {
     month: string
     wordsLearned: number
     masteredWords: number
     studyTime: number
     averageAccuracy: number
   }

   export interface CategoryPerformance {
     category: string
     totalWords: number
     masteredWords: number
     accuracy: number
     averageResponseTime: number
     difficulty: number // 1-5 scale
   }
   ```

2. **Automated Statistics Hook:**
   Use the Write tool to create `src/hooks/useStatistics.ts`:

   ```typescript
   import { useState, useEffect, useCallback } from 'react'
   import { useAuth } from '../contexts/AuthContext'
   import { supabase } from '../lib/supabase'
   import { LearningStatistics, DailyProgress, CategoryPerformance } from '../types/statistics'

   export const useStatistics = () => {
     const { user } = useAuth()
     const [statistics, setStatistics] = useState<LearningStatistics | null>(null)
     const [loading, setLoading] = useState(true)

     const calculateStatistics = useCallback(async (): Promise<LearningStatistics> => {
       if (!user) throw new Error('User not authenticated')

       // Fetch user progress data
       const { data: progressData } = await supabase
         .from('user_progress')
         .select('*')
         .eq('user_id', user.id)

       // Fetch learning sessions data
       const { data: sessionsData } = await supabase
         .from('learning_sessions')
         .select('*')
         .eq('user_id', user.id)
         .order('started_at', { ascending: false })

       // Fetch words data for category analysis
       const { data: wordsData } = await supabase
         .from('words')
         .select('*')

       if (!progressData || !sessionsData || !wordsData) {
         throw new Error('Failed to fetch statistics data')
       }

       // Calculate basic statistics
       const totalAttempts = progressData.reduce((sum, p) => sum + p.correct_count + p.wrong_count, 0)
       const correctAnswers = progressData.reduce((sum, p) => sum + p.correct_count, 0)
       const wrongAnswers = progressData.reduce((sum, p) => sum + p.wrong_count, 0)
       const accuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0

       // Mastery level distribution
       const masteredWords = progressData.filter(p => p.mastery_level >= 4).length
       const almostMasteredWords = progressData.filter(p => p.mastery_level === 3).length
       const learningWords = progressData.filter(p => p.mastery_level >= 1 && p.mastery_level <= 2).length
       const newWords = wordsData.length - progressData.length

       // Calculate streaks
       const sortedSessions = sessionsData
         .filter(s => s.ended_at)
         .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())

       const { currentStreak, longestStreak } = calculateStreaks(sortedSessions)

       // Calculate daily progress
       const dailyProgress = calculateDailyProgress(sessionsData, progressData)

       // Calculate category performance
       const categoryPerformance = calculateCategoryPerformance(progressData, wordsData)

       // Calculate time-based metrics
       const totalStudyTime = sessionsData.reduce((sum, s) => {
         if (s.ended_at) {
           const duration = new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()
           return sum + (duration / (1000 * 60)) // Convert to minutes
         }
         return sum
       }, 0)

       const averageSessionLength = sessionsData.length > 0 ? totalStudyTime / sessionsData.length : 0

       // Study consistency
       const today = new Date()
       const thisWeekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
       const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)

       const studyDaysThisWeek = getUniqueDays(sessionsData, thisWeekStart, today)
       const studyDaysThisMonth = getUniqueDays(sessionsData, thisMonthStart, today)

       return {
         totalWordsStudied: progressData.length,
         totalAttempts,
         correctAnswers,
         wrongAnswers,
         accuracy,
         currentStreak,
         longestStreak,
         studyDaysThisWeek,
         studyDaysThisMonth,
         consecutiveStudyDays: currentStreak,
         masteredWords,
         almostMasteredWords,
         learningWords,
         newWords,
         averageSessionLength,
         totalStudyTime,
         averageResponseTime: 2500, // This would need more detailed tracking
         studyTimeToday: getStudyTimeForPeriod(sessionsData, new Date(), new Date()),
         studyTimeThisWeek: getStudyTimeForPeriod(sessionsData, thisWeekStart, today),
         studyTimeThisMonth: getStudyTimeForPeriod(sessionsData, thisMonthStart, today),
         dailyProgress,
         weeklyProgress: [], // Calculate weekly aggregates
         monthlyProgress: [], // Calculate monthly aggregates
         categoryPerformance,
         wordsLearnedPerHour: totalStudyTime > 0 ? (progressData.length / (totalStudyTime / 60)) : 0,
         retentionRate: calculateRetentionRate(progressData),
         improvementRate: calculateImprovementRate(dailyProgress),
         estimatedTimeToMastery: estimateTimeToMastery(progressData, wordsData.length),
         recommendedDailyGoal: calculateRecommendedDailyGoal(progressData, currentStreak),
         projectedMasteryDate: new Date() // Calculate based on current pace
       }
     }, [user])

     // Helper functions
     const calculateStreaks = (sessions: any[]) => {
       // Implementation for streak calculation
       let currentStreak = 0
       let longestStreak = 0
       let tempStreak = 0

       const sessionDates = sessions.map(s =>
         new Date(s.started_at).toDateString()
       )
       const uniqueDates = [...new Set(sessionDates)].sort()

       for (let i = 0; i < uniqueDates.length; i++) {
         const currentDate = new Date(uniqueDates[i])
         const previousDate = i > 0 ? new Date(uniqueDates[i - 1]) : null

         if (previousDate) {
           const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24))
           if (daysDiff === 1) {
             tempStreak++
           } else {
             longestStreak = Math.max(longestStreak, tempStreak)
             tempStreak = 1
           }
         } else {
           tempStreak = 1
         }
       }

       currentStreak = tempStreak
       longestStreak = Math.max(longestStreak, tempStreak)

       return { currentStreak, longestStreak }
     }

     const calculateDailyProgress = (sessions: any[], progress: any[]): DailyProgress[] => {
       // Group sessions and progress by date
       const dailyData = new Map<string, DailyProgress>()

       sessions.forEach(session => {
         const date = new Date(session.started_at).toISOString().split('T')[0]
         const existing = dailyData.get(date) || {
           date,
           wordsStudied: 0,
           correctAnswers: 0,
           wrongAnswers: 0,
           studyTime: 0,
           newWordsLearned: 0,
           averageResponseTime: 0
         }

         existing.wordsStudied += session.words_studied || 0
         existing.correctAnswers += session.correct_answers || 0
         existing.wrongAnswers += (session.words_studied || 0) - (session.correct_answers || 0)

         if (session.ended_at) {
           const duration = new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()
           existing.studyTime += duration / (1000 * 60) // minutes
         }

         dailyData.set(date, existing)
       })

       return Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date))
     }

     const calculateCategoryPerformance = (progress: any[], words: any[]): CategoryPerformance[] => {
       const categoryMap = new Map<string, CategoryPerformance>()

       words.forEach(word => {
         const wordProgress = progress.find(p => p.word_id === word.id)
         const category = word.category

         const existing = categoryMap.get(category) || {
           category,
           totalWords: 0,
           masteredWords: 0,
           accuracy: 0,
           averageResponseTime: 0,
           difficulty: 0
         }

         existing.totalWords++

         if (wordProgress) {
           if (wordProgress.mastery_level >= 4) {
             existing.masteredWords++
           }

           const totalAttempts = wordProgress.correct_count + wordProgress.wrong_count
           if (totalAttempts > 0) {
             const wordAccuracy = wordProgress.correct_count / totalAttempts
             existing.accuracy = (existing.accuracy * (existing.totalWords - 1) + wordAccuracy) / existing.totalWords
           }
         }

         categoryMap.set(category, existing)
       })

       return Array.from(categoryMap.values())
     }

     // Load statistics
     const loadStatistics = useCallback(async () => {
       if (!user) return

       try {
         setLoading(true)
         const stats = await calculateStatistics()
         setStatistics(stats)
       } catch (error) {
         console.error('Error loading statistics:', error)
       } finally {
         setLoading(false)
       }
     }, [calculateStatistics, user])

     useEffect(() => {
       loadStatistics()
     }, [loadStatistics])

     return {
       statistics,
       loading,
       refreshStatistics: loadStatistics
     }
   }
   ```

3. **Automated Dashboard Component:**
   Use the Write tool to create `src/components/Statistics.tsx`:

   ```typescript
   import React from 'react'
   import { useStatistics } from '../hooks/useStatistics'
   import { StatCard } from './ui/StatCard'
   import { ProgressChart } from './charts/ProgressChart'
   import { CategoryChart } from './charts/CategoryChart'
   import { StreakCalendar } from './charts/StreakCalendar'
   import { LoadingSpinner } from './ui/LoadingSpinner'

   export const Statistics: React.FC = () => {
     const { statistics, loading } = useStatistics()

     if (loading) {
       return <LoadingSpinner size="large" message="Loading statistics..." />
     }

     if (!statistics) {
       return (
         <div className="text-center py-8">
           <p className="text-gray-500 dark:text-gray-400">
             No statistics available yet. Start learning to see your progress!
           </p>
         </div>
       )
     }

     return (
       <div className="space-y-6">
         {/* Overview Cards */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           <StatCard
             title="Words Studied"
             value={statistics.totalWordsStudied}
             icon="📚"
             trend={statistics.improvementRate > 0 ? 'up' : 'stable'}
           />
           <StatCard
             title="Accuracy"
             value={`${statistics.accuracy}%`}
             icon="🎯"
             trend={statistics.accuracy >= 80 ? 'up' : 'down'}
           />
           <StatCard
             title="Current Streak"
             value={statistics.currentStreak}
             icon="🔥"
             trend={statistics.currentStreak > 0 ? 'up' : 'down'}
             subtitle="days"
           />
           <StatCard
             title="Mastered Words"
             value={statistics.masteredWords}
             icon="⭐"
             trend="up"
           />
         </div>

         {/* Progress Charts */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
               Daily Progress
             </h3>
             <ProgressChart data={statistics.dailyProgress} />
           </div>

           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
               Category Performance
             </h3>
             <CategoryChart data={statistics.categoryPerformance} />
           </div>
         </div>

         {/* Study Calendar */}
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
           <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
             Study Calendar
           </h3>
           <StreakCalendar dailyProgress={statistics.dailyProgress} />
         </div>

         {/* Detailed Statistics */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Time Statistics */}
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
               Study Time
             </h3>
             <div className="space-y-3">
               <div className="flex justify-between">
                 <span className="text-gray-600 dark:text-gray-300">Today</span>
                 <span className="font-medium">{Math.round(statistics.studyTimeToday)}m</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-600 dark:text-gray-300">This Week</span>
                 <span className="font-medium">{Math.round(statistics.studyTimeThisWeek)}m</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-600 dark:text-gray-300">This Month</span>
                 <span className="font-medium">{Math.round(statistics.studyTimeThisMonth)}m</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-600 dark:text-gray-300">Average Session</span>
                 <span className="font-medium">{Math.round(statistics.averageSessionLength)}m</span>
               </div>
             </div>
           </div>

           {/* Mastery Distribution */}
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
               Mastery Levels
             </h3>
             <div className="space-y-3">
               <div className="flex justify-between items-center">
                 <span className="text-gray-600 dark:text-gray-300">⭐ Mastered</span>
                 <span className="font-medium text-green-600">{statistics.masteredWords}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-gray-600 dark:text-gray-300">📈 Almost There</span>
                 <span className="font-medium text-yellow-600">{statistics.almostMasteredWords}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-gray-600 dark:text-gray-300">📚 Learning</span>
                 <span className="font-medium text-blue-600">{statistics.learningWords}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-gray-600 dark:text-gray-300">🆕 New</span>
                 <span className="font-medium text-gray-600">{statistics.newWords}</span>
               </div>
             </div>
           </div>

           {/* Goals and Predictions */}
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
               Goals & Predictions
             </h3>
             <div className="space-y-3">
               <div className="flex justify-between">
                 <span className="text-gray-600 dark:text-gray-300">Daily Goal</span>
                 <span className="font-medium">{statistics.recommendedDailyGoal} words</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-600 dark:text-gray-300">Learning Rate</span>
                 <span className="font-medium">{statistics.wordsLearnedPerHour.toFixed(1)}/hr</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-600 dark:text-gray-300">Retention Rate</span>
                 <span className="font-medium">{Math.round(statistics.retentionRate)}%</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-600 dark:text-gray-300">Time to Mastery</span>
                 <span className="font-medium">{statistics.estimatedTimeToMastery} days</span>
               </div>
             </div>
           </div>
         </div>
       </div>
     )
   }
   ```

4. **Chart Components:**
   Create reusable chart components using a simple charting library or SVG

5. **Export Functionality:**
   Add the ability to export statistics as PDF or CSV

6. **Goal Setting:**
   Implement goal setting and tracking features

**Important**: Use Write tool to create ALL statistics components automatically. Use Supabase MCP server for all analytics data operations. Generate complete dashboard with data visualization, performance tracking, and automated insights.

**Expected Outcome**: Complete statistics dashboard with automated data collection, visualization components, and MCP server integration for analytics.
```

## Prerequisites
- Completed Phase 5.1 (Spaced Repetition System)
- Understanding of data visualization
- Knowledge of statistical calculations
- Experience with chart libraries (optional)

## Expected Outcomes
- Comprehensive statistics dashboard
- Data visualization components
- Performance analytics
- Goal tracking and recommendations
- Export functionality

## Next Steps
After completing this task, proceed to Phase 5.3: Category Filter