import React from 'react'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  message?: string
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}
        data-testid="loading-spinner"
        aria-label="Loading"
        role="status"
      />
      {message && (
        <p
          className="text-gray-600 dark:text-gray-300 text-sm animate-pulse"
          data-testid="loading-message"
        >
          {message}
        </p>
      )}
    </div>
  )
}