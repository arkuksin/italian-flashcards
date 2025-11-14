import React from 'react';
import { Skeleton } from '../Skeleton';

export const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-24" />
      </div>
    ))}
  </div>
);
