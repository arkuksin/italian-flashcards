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
