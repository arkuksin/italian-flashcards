import React from 'react'

interface ProgressRingProps {
  value: number // 0-100
  size?: number // size in pixels
  strokeWidth?: number
  className?: string
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 48,
  strokeWidth = 4,
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  // Color based on mastery level
  const getColor = (percentage: number): string => {
    if (percentage >= 80) return 'text-green-500 dark:text-green-400'
    if (percentage >= 60) return 'text-blue-500 dark:text-blue-400'
    if (percentage >= 40) return 'text-yellow-500 dark:text-yellow-400'
    if (percentage >= 20) return 'text-orange-500 dark:text-orange-400'
    return 'text-red-500 dark:text-red-400'
  }

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${getColor(value)} transition-all duration-500`}
        />
      </svg>
      {/* Percentage text in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-semibold ${getColor(value)}`}>
          {Math.round(value)}%
        </span>
      </div>
    </div>
  )
}
