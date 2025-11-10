import React from 'react'
import { motion } from 'framer-motion'

interface MasteryLevelBadgeProps {
  level: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
}

/**
 * MasteryLevelBadge - Phase 2 Leitner System Component
 *
 * Displays a color-coded badge representing the Leitner box level (0-5).
 * Colors indicate the mastery progression from new words to mastered.
 */
export const MasteryLevelBadge: React.FC<MasteryLevelBadgeProps> = ({
  level,
  size = 'md',
  showLabel = true,
  animated = true,
}) => {
  // Leitner box color scheme
  const getLevelConfig = (level: number) => {
    switch (level) {
      case 0:
        return {
          bg: 'bg-gray-200 dark:bg-gray-700',
          text: 'text-gray-700 dark:text-gray-300',
          border: 'border-gray-300 dark:border-gray-600',
          label: 'New',
          description: 'Never seen',
        }
      case 1:
        return {
          bg: 'bg-red-100 dark:bg-red-900/40',
          text: 'text-red-700 dark:text-red-300',
          border: 'border-red-300 dark:border-red-700',
          label: 'Learning',
          description: 'Review daily',
        }
      case 2:
        return {
          bg: 'bg-orange-100 dark:bg-orange-900/40',
          text: 'text-orange-700 dark:text-orange-300',
          border: 'border-orange-300 dark:border-orange-700',
          label: 'Familiar',
          description: 'Review every 3 days',
        }
      case 3:
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/40',
          text: 'text-yellow-700 dark:text-yellow-300',
          border: 'border-yellow-300 dark:border-yellow-700',
          label: 'Known',
          description: 'Review weekly',
        }
      case 4:
        return {
          bg: 'bg-green-100 dark:bg-green-900/40',
          text: 'text-green-700 dark:text-green-300',
          border: 'border-green-300 dark:border-green-700',
          label: 'Well Known',
          description: 'Review bi-weekly',
        }
      case 5:
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/40',
          text: 'text-blue-700 dark:text-blue-300',
          border: 'border-blue-300 dark:border-blue-700',
          label: 'Mastered',
          description: 'Review monthly',
        }
      default:
        return {
          bg: 'bg-gray-200 dark:bg-gray-700',
          text: 'text-gray-700 dark:text-gray-300',
          border: 'border-gray-300 dark:border-gray-600',
          label: 'Unknown',
          description: '',
        }
    }
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const config = getLevelConfig(level)

  const BadgeContent = (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium border
        ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}
      `}
      title={config.description}
      data-testid={`mastery-badge-level-${level}`}
    >
      <span className="font-bold">L{level}</span>
      {showLabel && size !== 'sm' && (
        <span className="hidden sm:inline">{config.label}</span>
      )}
    </div>
  )

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {BadgeContent}
      </motion.div>
    )
  }

  return BadgeContent
}
