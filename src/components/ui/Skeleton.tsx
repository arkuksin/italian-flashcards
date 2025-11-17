import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
  shimmer?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animate = true,
  shimmer = false,
}) => {
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClass = animate ? 'animate-pulse' : '';

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`
        relative overflow-hidden
        ${variants[variant]}
        ${animationClass}
        bg-gray-200 dark:bg-gray-700
        ${className}
      `}
      style={Object.keys(style).length > 0 ? style : undefined}
      role="status"
      aria-label="Loading..."
    >
      {shimmer && (
        <div
          className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{
            animation: 'shimmer 1.5s infinite',
          }}
        />
      )}
    </div>
  );
};
