# Phase 5.3: Category Filter

## Task Description
Create an advanced category filtering system with smart recommendations, difficulty-based filtering, and personalized learning paths that adapts to user progress and learning preferences.

## Claude Code Prompt

```
I need you to automatically create an advanced category filtering system using the Write tool to generate all filtering components and integrate with Supabase MCP server. This should go beyond basic category selection to include smart recommendations, difficulty-based filtering, progress-based suggestions, and personalized learning paths.

Please help me with the following:

1. **Enhanced Category Types:**
   Create comprehensive category types in `src/types/categories.ts`:

   ```typescript
   export interface Category {
     id: string
     name: string
     displayName: string
     description: string
     difficulty: number // 1-5 scale
     estimatedLearningTime: number // hours
     prerequisites?: string[] // category IDs
     tags: string[]
     color: string
     icon: string
     totalWords: number
   }

   export interface CategoryProgress {
     categoryId: string
     totalWords: number
     studiedWords: number
     masteredWords: number
     averageAccuracy: number
     averageResponseTime: number
     timeSpent: number // minutes
     lastStudiedDate?: Date
     difficulty: number
     completionPercentage: number
     recommendedNext: boolean
   }

   export interface CategoryRecommendation {
     category: Category
     reason: RecommendationReason
     priority: number // 1-10 scale
     estimatedBenefit: string
     timeToComplete: number // estimated hours
   }

   export interface FilterOptions {
     selectedCategories: string[]
     difficultyRange: [number, number]
     progressFilter: 'all' | 'new' | 'in-progress' | 'mastered' | 'needs-review'
     timeAvailable: number // minutes
     focusMode: 'balanced' | 'new-words' | 'review' | 'weak-areas'
     includeRecommended: boolean
   }

   export type RecommendationReason =
     | 'prerequisite-completed'
     | 'similar-difficulty'
     | 'weak-area'
     | 'review-due'
     | 'learning-path'
     | 'user-preference'
     | 'quick-session'
   ```

2. **Automated Category Configuration:**
   Use the Write tool to create `src/data/categories.ts`:

   ```typescript
   export const CATEGORIES: Category[] = [
     {
       id: 'nouns',
       name: 'nouns',
       displayName: 'Nouns',
       description: 'Common objects, places, and concepts',
       difficulty: 2,
       estimatedLearningTime: 3,
       tags: ['beginner', 'essential'],
       color: '#3B82F6',
       icon: '🏠',
       totalWords: 0 // Will be calculated dynamically
     },
     {
       id: 'verbs',
       name: 'verbs',
       displayName: 'Verbs',
       description: 'Action words and states of being',
       difficulty: 3,
       estimatedLearningTime: 4,
       prerequisites: ['nouns'],
       tags: ['intermediate', 'grammar'],
       color: '#10B981',
       icon: '🏃',
       totalWords: 0
     },
     {
       id: 'adjectives',
       name: 'adjectives',
       displayName: 'Adjectives',
       description: 'Descriptive words and qualities',
       difficulty: 4,
       estimatedLearningTime: 3,
       prerequisites: ['nouns'],
       tags: ['intermediate', 'descriptive'],
       color: '#F59E0B',
       icon: '🎨',
       totalWords: 0
     },
     {
       id: 'colors',
       name: 'colors',
       displayName: 'Colors',
       description: 'Basic color vocabulary',
       difficulty: 1,
       estimatedLearningTime: 1,
       tags: ['beginner', 'visual'],
       color: '#EF4444',
       icon: '🌈',
       totalWords: 0
     },
     {
       id: 'family',
       name: 'family',
       displayName: 'Family',
       description: 'Family members and relationships',
       difficulty: 2,
       estimatedLearningTime: 2,
       tags: ['beginner', 'personal'],
       color: '#8B5CF6',
       icon: '👨‍👩‍👧‍👦',
       totalWords: 0
     },
     {
       id: 'numbers',
       name: 'numbers',
       displayName: 'Numbers',
       description: 'Cardinal and ordinal numbers',
       difficulty: 2,
       estimatedLearningTime: 2,
       tags: ['beginner', 'math'],
       color: '#06B6D4',
       icon: '🔢',
       totalWords: 0
     },
     {
       id: 'time',
       name: 'time',
       displayName: 'Time',
       description: 'Time expressions and temporal concepts',
       difficulty: 3,
       estimatedLearningTime: 3,
       prerequisites: ['numbers'],
       tags: ['intermediate', 'temporal'],
       color: '#84CC16',
       icon: '⏰',
       totalWords: 0
     },
     {
       id: 'food',
       name: 'food',
       displayName: 'Food & Drink',
       description: 'Culinary vocabulary and dining',
       difficulty: 2,
       estimatedLearningTime: 4,
       tags: ['practical', 'culture'],
       color: '#F97316',
       icon: '🍝',
       totalWords: 0
     }
     // Add more categories as needed
   ]

   export const CATEGORY_LEARNING_PATHS = [
     {
       name: 'Beginner Path',
       description: 'Perfect for absolute beginners',
       categories: ['colors', 'numbers', 'family', 'nouns', 'common'],
       estimatedWeeks: 4
     },
     {
       name: 'Practical Italian',
       description: 'Focus on everyday communication',
       categories: ['food', 'transport', 'places', 'directions', 'communication'],
       estimatedWeeks: 6
     },
     {
       name: 'Grammar Foundation',
       description: 'Build strong grammatical understanding',
       categories: ['nouns', 'verbs', 'adjectives', 'time', 'common'],
       estimatedWeeks: 8
     }
   ]
   ```

3. **Automated Filter Hook:**
   Use the Write tool to create `src/hooks/useCategoryFilter.ts`:

   ```typescript
   import { useState, useEffect, useCallback, useMemo } from 'react'
   import { useProgress } from './useProgress'
   import { CATEGORIES, CATEGORY_LEARNING_PATHS } from '../data/categories'
   import { Category, CategoryProgress, CategoryRecommendation, FilterOptions } from '../types/categories'

   export const useCategoryFilter = () => {
     const { progress } = useProgress()
     const [filterOptions, setFilterOptions] = useState<FilterOptions>({
       selectedCategories: [],
       difficultyRange: [1, 5],
       progressFilter: 'all',
       timeAvailable: 15,
       focusMode: 'balanced',
       includeRecommended: true
     })

     // Calculate category progress from user progress data
     const categoryProgress = useMemo((): CategoryProgress[] => {
       const categoryMap = new Map<string, CategoryProgress>()

       // Initialize all categories
       CATEGORIES.forEach(category => {
         categoryMap.set(category.id, {
           categoryId: category.id,
           totalWords: 0,
           studiedWords: 0,
           masteredWords: 0,
           averageAccuracy: 0,
           averageResponseTime: 0,
           timeSpent: 0,
           difficulty: category.difficulty,
           completionPercentage: 0,
           recommendedNext: false
         })
       })

       // Calculate progress for each category
       // This would need integration with your words data
       // For now, we'll simulate the calculation

       return Array.from(categoryMap.values())
     }, [progress])

     // Generate smart recommendations
     const getRecommendations = useCallback((): CategoryRecommendation[] => {
       const recommendations: CategoryRecommendation[] = []

       CATEGORIES.forEach(category => {
         const categoryProg = categoryProgress.find(cp => cp.categoryId === category.id)
         if (!categoryProg) return

         let reason: RecommendationReason | null = null
         let priority = 0

         // Check if prerequisites are completed
         if (category.prerequisites) {
           const prerequisitesCompleted = category.prerequisites.every(prereqId => {
             const prereqProgress = categoryProgress.find(cp => cp.categoryId === prereqId)
             return prereqProgress && prereqProgress.completionPercentage >= 80
           })

           if (prerequisitesCompleted && categoryProg.completionPercentage < 20) {
             reason = 'prerequisite-completed'
             priority = 8
           }
         }

         // Recommend weak areas for review
         if (categoryProg.averageAccuracy < 70 && categoryProg.studiedWords > 5) {
           reason = 'weak-area'
           priority = 9
         }

         // Recommend based on time available
         if (filterOptions.timeAvailable <= 10 && category.difficulty <= 2) {
           reason = 'quick-session'
           priority = 6
         }

         // Recommend review-due categories
         if (categoryProg.lastStudiedDate) {
           const daysSinceStudy = Math.floor(
             (Date.now() - categoryProg.lastStudiedDate.getTime()) / (1000 * 60 * 60 * 24)
           )
           if (daysSinceStudy >= 3 && categoryProg.completionPercentage > 0) {
             reason = 'review-due'
             priority = 7
           }
         }

         if (reason && priority > 0) {
           recommendations.push({
             category,
             reason,
             priority,
             estimatedBenefit: getEstimatedBenefit(reason, categoryProg),
             timeToComplete: calculateTimeToComplete(category, categoryProg)
           })
         }
       })

       return recommendations.sort((a, b) => b.priority - a.priority)
     }, [categoryProgress, filterOptions.timeAvailable])

     // Filter words based on current filter options
     const getFilteredWords = useCallback((allWords: any[]) => {
       let filtered = allWords

       // Filter by selected categories
       if (filterOptions.selectedCategories.length > 0) {
         filtered = filtered.filter(word =>
           filterOptions.selectedCategories.includes(word.category)
         )
       }

       // Filter by difficulty (based on category difficulty)
       filtered = filtered.filter(word => {
         const category = CATEGORIES.find(c => c.name === word.category)
         if (!category) return true
         return category.difficulty >= filterOptions.difficultyRange[0] &&
                category.difficulty <= filterOptions.difficultyRange[1]
       })

       // Filter by progress status
       if (filterOptions.progressFilter !== 'all') {
         filtered = filtered.filter(word => {
           const wordProgress = progress.get(word.id)

           switch (filterOptions.progressFilter) {
             case 'new':
               return !wordProgress
             case 'in-progress':
               return wordProgress && wordProgress.mastery_level > 0 && wordProgress.mastery_level < 4
             case 'mastered':
               return wordProgress && wordProgress.mastery_level >= 4
             case 'needs-review':
               return wordProgress && needsReview(wordProgress)
             default:
               return true
           }
         })
       }

       // Apply focus mode
       switch (filterOptions.focusMode) {
         case 'new-words':
           filtered = filtered.filter(word => !progress.get(word.id))
           break
         case 'review':
           filtered = filtered.filter(word => {
             const wordProgress = progress.get(word.id)
             return wordProgress && needsReview(wordProgress)
           })
           break
         case 'weak-areas':
           filtered = filtered.filter(word => {
             const wordProgress = progress.get(word.id)
             return wordProgress && wordProgress.wrong_count > wordProgress.correct_count
           })
           break
       }

       // Limit based on available time
       const wordsPerMinute = 0.5 // Estimate based on average session data
       const maxWords = Math.floor(filterOptions.timeAvailable * wordsPerMinute)
       if (filtered.length > maxWords) {
         // Prioritize based on spaced repetition algorithm
         filtered = prioritizeWords(filtered, maxWords)
       }

       return filtered
     }, [filterOptions, progress])

     // Helper functions
     const needsReview = (wordProgress: any): boolean => {
       const daysSinceReview = Math.floor(
         (Date.now() - new Date(wordProgress.last_practiced).getTime()) / (1000 * 60 * 60 * 24)
       )
       const interval = getReviewInterval(wordProgress.mastery_level)
       return daysSinceReview >= interval
     }

     const getReviewInterval = (masteryLevel: number): number => {
       const intervals = [1, 3, 7, 14, 30, 90]
       return intervals[Math.min(masteryLevel, intervals.length - 1)]
     }

     const prioritizeWords = (words: any[], maxWords: number): any[] => {
       // Sort by priority: new words, then review-due, then by difficulty
       return words
         .sort((a, b) => {
           const aProgress = progress.get(a.id)
           const bProgress = progress.get(b.id)

           // New words first
           if (!aProgress && bProgress) return -1
           if (aProgress && !bProgress) return 1

           // Then review-due words
           if (aProgress && bProgress) {
             const aNeedsReview = needsReview(aProgress)
             const bNeedsReview = needsReview(bProgress)

             if (aNeedsReview && !bNeedsReview) return -1
             if (!aNeedsReview && bNeedsReview) return 1
           }

           return 0
         })
         .slice(0, maxWords)
     }

     const getEstimatedBenefit = (reason: RecommendationReason, categoryProgress: CategoryProgress): string => {
       switch (reason) {
         case 'prerequisite-completed':
           return 'Build on your foundation'
         case 'weak-area':
           return `Improve ${Math.round(100 - categoryProgress.averageAccuracy)}% accuracy`
         case 'review-due':
           return 'Maintain retention'
         case 'quick-session':
           return 'Perfect for short sessions'
         default:
           return 'Expand vocabulary'
       }
     }

     const calculateTimeToComplete = (category: Category, progress: CategoryProgress): number => {
       const remainingWords = category.totalWords - progress.studiedWords
       const wordsPerHour = 20 // Estimate based on user data
       return remainingWords / wordsPerHour
     }

     return {
       filterOptions,
       setFilterOptions,
       categoryProgress,
       recommendations: getRecommendations(),
       getFilteredWords,
       learningPaths: CATEGORY_LEARNING_PATHS,
       availableCategories: CATEGORIES
     }
   }
   ```

4. **Automated Filter Component:**
   Use the Write tool to create `src/components/CategoryFilter.tsx`:

   ```typescript
   import React, { useState } from 'react'
   import { useCategoryFilter } from '../hooks/useCategoryFilter'
   import { FilterOptions } from '../types/categories'

   export const CategoryFilter: React.FC = () => {
     const {
       filterOptions,
       setFilterOptions,
       categoryProgress,
       recommendations,
       learningPaths,
       availableCategories
     } = useCategoryFilter()

     const [showAdvanced, setShowAdvanced] = useState(false)

     const updateFilter = (updates: Partial<FilterOptions>) => {
       setFilterOptions(prev => ({ ...prev, ...updates }))
     }

     return (
       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
         <div className="flex items-center justify-between mb-6">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">
             Study Categories
           </h2>
           <button
             onClick={() => setShowAdvanced(!showAdvanced)}
             className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
           >
             {showAdvanced ? 'Simple' : 'Advanced'} Filters
           </button>
         </div>

         {/* Smart Recommendations */}
         {recommendations.length > 0 && (
           <div className="mb-6">
             <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
               💡 Recommended for You
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {recommendations.slice(0, 3).map(rec => (
                 <div
                   key={rec.category.id}
                   className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                   onClick={%raw%}={() => {
                     const newSelected = [...filterOptions.selectedCategories]
                     if (!newSelected.includes(rec.category.id)) {
                       newSelected.push(rec.category.id)
                       updateFilter({ selectedCategories: newSelected })
                     }
                   }}{%endraw%}
                 >
                   <div className="flex items-center space-x-3">
                     <span className="text-2xl">{rec.category.icon}</span>
                     <div className="flex-1">
                       <div className="font-medium text-blue-900 dark:text-blue-100">
                         {rec.category.displayName}
                       </div>
                       <div className="text-sm text-blue-700 dark:text-blue-200">
                         {rec.estimatedBenefit}
                       </div>
                     </div>
                     <div className="text-sm text-blue-600 dark:text-blue-300">
                       {Math.round(rec.timeToComplete)}h
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
         )}

         {/* Category Grid */}
         <div className="mb-6">
           <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
             Categories
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
             {availableCategories.map(category => {
               const progress = categoryProgress.find(cp => cp.categoryId === category.id)
               const isSelected = filterOptions.selectedCategories.includes(category.id)

               return (
                 <div
                   key={category.id}
                   className={`relative rounded-lg p-4 cursor-pointer transition-all ${
                     isSelected
                       ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500'
                       : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                   }`}
                   onClick={%raw%}={() => {
                     const newSelected = isSelected
                       ? filterOptions.selectedCategories.filter(id => id !== category.id)
                       : [...filterOptions.selectedCategories, category.id]
                     updateFilter({ selectedCategories: newSelected })
                   }}{%endraw%}
                 >
                   <div className="text-center">
                     <div className="text-2xl mb-2">{category.icon}</div>
                     <div className="font-medium text-sm text-gray-900 dark:text-white">
                       {category.displayName}
                     </div>
                     {progress && (
                       <div className="mt-2">
                         <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                           <div
                             className="bg-blue-600 h-1.5 rounded-full transition-all"
                             style={%raw%}{{ width: `${progress.completionPercentage}%` }}{%endraw%}
                           />
                         </div>
                         <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                           {Math.round(progress.completionPercentage)}%
                         </div>
                       </div>
                     )}
                   </div>

                   {/* Difficulty indicator */}
                   <div className="absolute top-2 right-2">
                     {'⭐'.repeat(category.difficulty)}
                   </div>
                 </div>
               )
             })}
           </div>
         </div>

         {/* Advanced Filters */}
         {showAdvanced && (
           <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-600">
             {/* Focus Mode */}
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                 Focus Mode
               </label>
               <select
                 value={filterOptions.focusMode}
                 onChange={e => updateFilter({ focusMode: e.target.value as any })}
                 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
               >
                 <option value="balanced">Balanced Learning</option>
                 <option value="new-words">New Words Only</option>
                 <option value="review">Review Mode</option>
                 <option value="weak-areas">Focus on Weak Areas</option>
               </select>
             </div>

             {/* Time Available */}
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                 Time Available: {filterOptions.timeAvailable} minutes
               </label>
               <input
                 type="range"
                 min="5"
                 max="60"
                 value={filterOptions.timeAvailable}
                 onChange={e => updateFilter({ timeAvailable: parseInt(e.target.value) })}
                 className="w-full"
               />
             </div>

             {/* Difficulty Range */}
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                 Difficulty Range: {filterOptions.difficultyRange[0]} - {filterOptions.difficultyRange[1]}
               </label>
               <div className="flex space-x-4">
                 <input
                   type="range"
                   min="1"
                   max="5"
                   value={filterOptions.difficultyRange[0]}
                   onChange={e => updateFilter({
                     difficultyRange: [parseInt(e.target.value), filterOptions.difficultyRange[1]]
                   })}
                   className="flex-1"
                 />
                 <input
                   type="range"
                   min="1"
                   max="5"
                   value={filterOptions.difficultyRange[1]}
                   onChange={e => updateFilter({
                     difficultyRange: [filterOptions.difficultyRange[0], parseInt(e.target.value)]
                   })}
                   className="flex-1"
                 />
               </div>
             </div>
           </div>
         )}

         {/* Learning Paths */}
         <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
           <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
             📚 Learning Paths
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             {learningPaths.map(path => (
               <div
                 key={path.name}
                 className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 rounded-lg p-4 cursor-pointer hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-800 dark:hover:to-blue-800 transition-all"
                 onClick={() => updateFilter({ selectedCategories: path.categories })}
               >
                 <div className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                   {path.name}
                 </div>
                 <div className="text-sm text-purple-700 dark:text-purple-200 mb-2">
                   {path.description}
                 </div>
                 <div className="text-xs text-purple-600 dark:text-purple-300">
                   ~{path.estimatedWeeks} weeks
                 </div>
               </div>
             ))}
           </div>
         </div>
       </div>
     )
   }
   ```

5. **Integration with Main App:**
   Show how to integrate the advanced category filter with the main application flow

6. **Smart Session Planning:**
   Add functionality to automatically plan study sessions based on available time and user goals

**Important**: Use Write tool to create ALL filtering components automatically. Use Supabase MCP server for progress data operations. Generate complete filtering system with smart recommendations, learning paths, and automated session planning.

**Expected Outcome**: Complete advanced filtering system with personalized recommendations, smart session planning, and MCP server integration for progress-based filtering.
```

## Prerequisites
- Completed Phase 5.2 (Statistics Dashboard)
- Understanding of filtering algorithms
- Knowledge of learning path optimization
- Experience with complex state management

## Expected Outcomes
- Advanced category filtering system
- Smart learning recommendations
- Personalized learning paths
- Time-based session planning
- Adaptive difficulty adjustment

## Project Completion
Congratulations! You have completed all phases of the Italian Flashcards application migration from a static frontend to a comprehensive full-stack learning platform with authentication, progress tracking, and advanced learning features.