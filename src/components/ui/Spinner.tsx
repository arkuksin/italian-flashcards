import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'blue' | 'green' | 'red' | 'purple' | 'gray';
  label?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color = 'blue',
  label,
  className = '',
}) => {
  const sizes = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-2',
    large: 'w-16 h-16 border-4',
  };

  const colors = {
    blue: 'border-t-blue-600 dark:border-t-blue-500',
    green: 'border-t-green-600 dark:border-t-green-500',
    red: 'border-t-red-600 dark:border-t-red-500',
    purple: 'border-t-purple-600 dark:border-t-purple-500',
    gray: 'border-t-gray-600 dark:border-t-gray-500',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div
        className={`
          ${sizes[size]}
          border-gray-200 dark:border-gray-700
          ${colors[color]}
          rounded-full
          animate-spin
        `}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {label}
        </span>
      )}
    </div>
  );
};
