import { WordProgress, DifficultyRating } from '../types'

export const getNextReviewDate = (masteryLevel: number, lastReviewed: Date): Date => {
  const intervals = [1, 3, 7, 14, 30, 90] // days
  const interval = intervals[Math.min(masteryLevel, intervals.length - 1)]

  const nextReview = new Date(lastReviewed)
  nextReview.setDate(nextReview.getDate() + interval)

  return nextReview
}

/**
 * Phase 3: Get adaptive review date based on difficulty rating
 * Adjusts intervals based on how easily the user remembered the word
 *
 * @param masteryLevel - Current mastery level (0-5)
 * @param lastReviewed - Date of last review
 * @param difficultyRating - User's difficulty rating (1=Again, 2=Hard, 3=Good, 4=Easy)
 * @returns Next review date
 */
export const getAdaptiveReviewDate = (
  masteryLevel: number,
  lastReviewed: Date,
  difficultyRating?: DifficultyRating
): Date => {
  // Base intervals in days for each mastery level
  const baseIntervals = [1, 3, 7, 14, 30, 90]
  const baseInterval = baseIntervals[Math.min(masteryLevel, baseIntervals.length - 1)]

  // If no difficulty rating provided, use base interval
  if (!difficultyRating) {
    const nextReview = new Date(lastReviewed)
    nextReview.setDate(nextReview.getDate() + baseInterval)
    return nextReview
  }

  // Adjust interval based on difficulty rating
  let adjustedInterval: number

  switch (difficultyRating) {
    case 1: // Again - forgot completely, very short interval
      adjustedInterval = Math.max(1, Math.floor(baseInterval * 0.5))
      break
    case 2: // Hard - difficult to remember, shorter interval
      adjustedInterval = Math.max(1, Math.floor(baseInterval * 0.7))
      break
    case 3: // Good - normal interval
      adjustedInterval = baseInterval
      break
    case 4: // Easy - remembered easily, longer interval
      adjustedInterval = Math.floor(baseInterval * 1.5)
      break
    default:
      adjustedInterval = baseInterval
  }

  const nextReview = new Date(lastReviewed)
  nextReview.setDate(nextReview.getDate() + adjustedInterval)

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

/**
 * Calculates mastery level based on performance using TRUE Leitner system
 *
 * Phase 1 Implementation (2025-11-10):
 * - Correct answer: Move UP one level (max 5)
 * - Wrong answer: Move DOWN two levels (min 0)
 *
 * This replaces the old success-rate-based approach with incremental box movement,
 * which is more aligned with the traditional Leitner spaced repetition method.
 *
 * @param currentLevel - Current mastery level (0-5)
 * @param correct - Whether the answer was correct
 * @returns New mastery level (0-5)
 */
export const calculateMasteryLevel = (currentLevel: number, correct: boolean): number => {
  if (correct) {
    // Correct answer: move up one level (max 5)
    return Math.min(currentLevel + 1, 5)
  } else {
    // Wrong answer: move down two levels (min 0)
    // This ensures forgotten words get more frequent review
    return Math.max(currentLevel - 2, 0)
  }
}

/**
 * Legacy function for backward compatibility
 * Calculates initial mastery level based on success rate
 * Used only for migrating old data or initializing from statistics
 *
 * @param correctCount - Number of correct answers
 * @param wrongCount - Number of wrong answers
 * @returns Mastery level (0-5)
 * @deprecated Use calculateMasteryLevel(currentLevel, correct) instead
 */
export const calculateMasteryLevelFromStats = (correctCount: number, wrongCount: number): number => {
  const totalAttempts = correctCount + wrongCount
  const successRate = totalAttempts > 0 ? correctCount / totalAttempts : 0

  // Legacy success rate thresholds
  if (successRate >= 0.9 && totalAttempts >= 5) return 5
  if (successRate >= 0.8 && totalAttempts >= 4) return 4
  if (successRate >= 0.7 && totalAttempts >= 3) return 3
  if (successRate >= 0.6 && totalAttempts >= 2) return 2
  if (totalAttempts >= 1) return 1

  return 0
}

/**
 * Gets all words that are due for review
 *
 * @param allWordIds - All available word IDs
 * @param progressMap - Map of word IDs to their progress data
 * @returns Array of word IDs that are due for review
 */
export const getDueWords = (
  allWordIds: number[],
  progressMap: Map<number, WordProgress>
): number[] => {
  return allWordIds.filter(wordId => {
    const progress = progressMap.get(wordId)
    return isWordDue(progress)
  })
}
