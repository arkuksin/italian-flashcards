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

/**
 * Calculates mastery level based on performance using Leitner system
 *
 * @param correctCount - Number of correct answers
 * @param wrongCount - Number of wrong answers
 * @returns Mastery level (0-5)
 */
export const calculateMasteryLevel = (correctCount: number, wrongCount: number): number => {
  const totalAttempts = correctCount + wrongCount
  const successRate = totalAttempts > 0 ? correctCount / totalAttempts : 0

  // Leitner system mastery thresholds
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
