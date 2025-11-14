import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useProgress } from '../hooks/useProgress'
import { MasteryLevelBadge } from './MasteryLevelBadge'
import { MARGIN_BOTTOM, GAP, VERTICAL_SPACING, PADDING } from '../constants/spacing'

/**
 * LeitnerBoxVisualizer - Phase 2 Leitner System Component
 *
 * Visual representation of the Leitner box system showing:
 * - Word distribution across boxes (levels 0-5)
 * - Box sizes corresponding to review intervals
 * - Color-coded levels for quick understanding
 */
export const LeitnerBoxVisualizer: React.FC = () => {
  const { progress } = useProgress()

  // Calculate word distribution across levels
  const distribution = useMemo(() => {
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

    progress.forEach((wordProgress) => {
      const level = wordProgress.mastery_level
      if (level >= 0 && level <= 5) {
        counts[level as keyof typeof counts]++
      }
    })

    return counts
  }, [progress])

  const totalWords = Object.values(distribution).reduce((sum, count) => sum + count, 0)

  // Box configuration with intervals
  const boxes = [
    { level: 5, interval: '90 days', height: 'h-20', description: 'Mastered' },
    { level: 4, interval: '30 days', height: 'h-16', description: 'Well Known' },
    { level: 3, interval: '14 days', height: 'h-14', description: 'Known' },
    { level: 2, interval: '7 days', height: 'h-12', description: 'Familiar' },
    { level: 1, interval: '3 days', height: 'h-10', description: 'Learning' },
    { level: 0, interval: '1 day', height: 'h-8', description: 'New' },
  ]

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${PADDING.comfortable}`} data-testid="leitner-box-visualizer">
      <h2 className={`text-xl font-bold text-gray-900 dark:text-white ${MARGIN_BOTTOM.md}`} data-testid="leitner-box-heading">
        Leitner Box System
      </h2>

      <div className={MARGIN_BOTTOM.lg}>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Words are organized into boxes based on how well you know them. Higher boxes = longer review intervals.
        </p>
      </div>

      {totalWords === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400" data-testid="leitner-empty-state">
          <p>Start learning to see your progress!</p>
        </div>
      ) : (
        <div className={VERTICAL_SPACING.sm}>
          {boxes.map((box, index) => {
            const count = distribution[box.level as keyof typeof distribution]
            const percentage = totalWords > 0 ? (count / totalWords) * 100 : 0

            return (
              <motion.div
                key={box.level}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
                data-testid={`leitner-level-${box.level}`}
              >
                <div className={`flex items-center ${GAP.md}`}>
                  {/* Box Level Badge */}
                  <div className="flex-shrink-0 w-28">
                    <MasteryLevelBadge level={box.level} size="sm" animated={false} />
                  </div>

                  {/* Visual Bar */}
                  <div className="flex-1">
                    <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden h-12">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className={`
                          absolute inset-y-0 left-0 rounded-lg
                          ${box.level === 5 ? 'bg-blue-500 dark:bg-blue-600' : ''}
                          ${box.level === 4 ? 'bg-green-500 dark:bg-green-600' : ''}
                          ${box.level === 3 ? 'bg-yellow-500 dark:bg-yellow-600' : ''}
                          ${box.level === 2 ? 'bg-orange-500 dark:bg-orange-600' : ''}
                          ${box.level === 1 ? 'bg-red-500 dark:bg-red-600' : ''}
                          ${box.level === 0 ? 'bg-gray-500 dark:bg-gray-600' : ''}
                        `}
                      />
                      <div className="relative h-full flex items-center justify-between px-4">
                        <span className="text-sm font-medium text-gray-900 dark:text-white z-10" data-testid={`level-${box.level}-count`}>
                          {count} {count === 1 ? 'word' : 'words'}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-300 z-10" data-testid={`level-${box.level}-interval`}>
                          Review: {box.interval}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Percentage */}
                  <div className="flex-shrink-0 w-12 text-right">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300" data-testid={`level-${box.level}-percentage`}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700" data-testid="leitner-total-words">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Total Words Studied</span>
          <span className="font-bold text-gray-900 dark:text-white text-lg" data-testid="total-words-count">{totalWords}</span>
        </div>
      </div>
    </div>
  )
}
