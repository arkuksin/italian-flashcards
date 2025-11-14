import React from 'react';
import { Skeleton } from '../Skeleton';

export const CategoryFilterSkeleton: React.FC = () => (
  <div className="space-y-2">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center gap-3">
        <Skeleton className="w-5 h-5" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="w-16 h-6" />
      </div>
    ))}
  </div>
);
