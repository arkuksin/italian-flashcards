import React from 'react';
import { Skeleton } from '../Skeleton';

export const LeitnerBoxSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
    <Skeleton className="h-6 w-48 mb-4" />
    <div className="flex gap-2 justify-between items-end h-64">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex-1 flex flex-col justify-end">
          <Skeleton className="h-32 w-full mb-2" style={{ height: `${Math.random() * 150 + 50}px` }} />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  </div>
);
