import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useProgress } from '../hooks/useProgress'

/**
 * BoxDistributionChart - Phase 2 Leitner System Component
 *
 * Compact visual chart showing word distribution across Leitner boxes.
 * Designed for display in the Statistics section for quick overview.
 */
export const BoxDistributionChart: React.FC = () => {
  const { progress } = useProgress()

  // Calculate word distribution across levels
  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0] // Levels 0-5

    progress.forEach((wordProgress) => {
      const level = wordProgress.mastery_level
      if (level >= 0 && level <= 5) {
        counts[level]++
      }
    })

    return counts
  }, [progress])

  const totalWords = distribution.reduce((sum, count) => sum + count, 0)
  const maxCount = Math.max(...distribution, 1) // Prevent division by zero

  const levelColors = [
    'bg-gray-400 dark:bg-gray-600',      // Level 0
    'bg-red-400 dark:bg-red-600',        // Level 1
    'bg-orange-400 dark:bg-orange-600',  // Level 2
    'bg-yellow-400 dark:bg-yellow-600',  // Level 3
    'bg-green-400 dark:bg-green-600',    // Level 4
    'bg-blue-400 dark:bg-blue-600',      // Level 5
  ]

  const levelLabels = ['New', 'L1', 'L2', 'L3', 'L4', 'L5']

  if (totalWords === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Mastery Distribution
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
          Start learning to see distribution
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Mastery Distribution
      </h3>

      {/* Bar Chart */}
      <div className="flex items-end gap-2 h-32 mb-2">
        {distribution.map((count, level) => {
          const heightPercentage = (count / maxCount) * 100

          return (
            <div key={level} className="flex-1 flex flex-col items-center">
              {/* Bar */}
              <div className="w-full flex flex-col justify-end h-24">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercentage}%` }}
                  transition={{ duration: 0.6, delay: level * 0.1 }}
                  className={`w-full rounded-t-md ${levelColors[level]} relative group`}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      {count} {count === 1 ? 'word' : 'words'}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Count Label */}
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">
                {count}
              </div>

              {/* Level Label */}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {levelLabels[level]}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-400 dark:bg-gray-600"></div>
            <span className="text-gray-600 dark:text-gray-400">New</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-400 dark:bg-yellow-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Learning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-400 dark:bg-blue-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Mastered</span>
          </div>
        </div>
      </div>
    </div>
  )
}
