import React from 'react';
import { Skeleton } from '../Skeleton';

export const AchievementBadgesSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-24" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <Skeleton variant="circular" className="w-16 h-16 mb-2" />
          <Skeleton className="h-4 w-20 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  </div>
);
