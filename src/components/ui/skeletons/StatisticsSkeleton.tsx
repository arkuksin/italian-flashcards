import React from 'react';
import { Skeleton } from '../Skeleton';

export const StatisticsSkeleton: React.FC = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-48 mb-4" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <Skeleton className="h-10 w-10 mb-2" />
          <Skeleton className="h-6 w-20 mb-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>
);
