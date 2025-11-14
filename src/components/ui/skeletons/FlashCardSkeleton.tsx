import React from 'react';
import { Skeleton } from '../Skeleton';

export const FlashCardSkeleton: React.FC = () => (
  <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
    <Skeleton className="h-12 w-3/4 mx-auto mb-8" />
    <Skeleton className="h-16 w-full rounded-2xl mb-6" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-12 rounded-xl" />
      ))}
    </div>
  </div>
);
