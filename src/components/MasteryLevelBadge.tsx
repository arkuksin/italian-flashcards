import React from 'react'
import { motion } from 'framer-motion'
import { getMasteryLevel, getMasteryBadgeColors } from '../constants/masteryColors'

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
  // Get mastery level configuration from centralized constants
  const config = getMasteryLevel(level)

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const BadgeContent = (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${getMasteryBadgeColors(level)} ${sizeClasses[size]}`}
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
