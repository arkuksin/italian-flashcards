import React from 'react';
import { Skeleton } from '../Skeleton';

interface ChartSkeletonProps {
  title?: boolean;
  height?: string;
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  title = true,
  height = 'h-64'
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
    {title && <Skeleton className="h-6 w-48 mb-4" />}
    <Skeleton className={`${height} w-full rounded-lg`} />
    <div className="flex gap-4 mt-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-28" />
    </div>
  </div>
);
