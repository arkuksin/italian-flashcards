# Add Polished Loading States with Skeletons

## Issue
Loading states currently use a generic spinner without skeleton screens, causing jarring content pop-in and poor perceived performance.

## Locations
Multiple components

## Problem Details

**Current loading pattern:**
```tsx
<div className="animate-spin rounded-full h-16 w-16
                border-b-2 border-blue-600" />
```

### Issues:
1. **Generic spinner** doesn't match brand
2. **No skeleton screens** (jarring content pop-in)
3. **Loading text not always present**
4. **Poor perceived performance**

## Impact
- Jarring content appearance
- Poor perceived performance
- Generic, unpolished feel
- Confusing user experience

## Task
Implement polished loading states with skeleton screens:

1. **Create Skeleton component:**
   ```tsx
   // src/components/ui/Skeleton.tsx
   interface SkeletonProps {
     className?: string;
     variant?: 'text' | 'circular' | 'rectangular';
     width?: string | number;
     height?: string | number;
     animate?: boolean;
   }

   export const Skeleton: React.FC<SkeletonProps> = ({
     className = '',
     variant = 'rectangular',
     width,
     height,
     animate = true,
   }) => {
     const variants = {
       text: 'rounded',
       circular: 'rounded-full',
       rectangular: 'rounded-lg',
     };

     const animationClass = animate ? 'animate-pulse' : '';

     return (
       <div
         className={`
           ${variants[variant]}
           ${animationClass}
           bg-gray-200 dark:bg-gray-700
           ${className}
         `}
         style={{ width, height }}
       />
     );
   };
   ```

2. **Create skeleton patterns for common layouts:**

   **Card Skeleton:**
   ```tsx
   // src/components/ui/skeletons/CardSkeleton.tsx
   export const CardSkeleton = () => (
     <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border">
       <Skeleton className="h-6 w-3/4 mb-4" />
       <Skeleton className="h-4 w-full mb-2" />
       <Skeleton className="h-4 w-5/6 mb-4" />
       <div className="flex gap-2 mt-4">
         <Skeleton className="h-10 w-24" />
         <Skeleton className="h-10 w-24" />
       </div>
     </div>
   );
   ```

   **List Skeleton:**
   ```tsx
   // src/components/ui/skeletons/ListSkeleton.tsx
   export const ListSkeleton = ({ count = 3 }: { count?: number }) => (
     <div className="space-y-4">
       {Array.from({ length: count }).map((_, i) => (
         <div key={i} className="flex items-center gap-4 p-4 border rounded-xl">
           <Skeleton variant="circular" className="w-12 h-12" />
           <div className="flex-1 space-y-2">
             <Skeleton className="h-4 w-3/4" />
             <Skeleton className="h-3 w-1/2" />
           </div>
         </div>
       ))}
     </div>
   );
   ```

   **Stats Skeleton:**
   ```tsx
   // src/components/ui/skeletons/StatsSkeleton.tsx
   export const StatsSkeleton = () => (
     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
       {[1, 2, 3].map((i) => (
         <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 border">
           <Skeleton className="h-4 w-20 mb-2" />
           <Skeleton className="h-8 w-16 mb-1" />
           <Skeleton className="h-3 w-24" />
         </div>
       ))}
     </div>
   );
   ```

3. **Create component-specific skeletons:**

   **CategoryFilter Skeleton:**
   ```tsx
   // src/components/CategoryFilter/CategoryFilterSkeleton.tsx
   export const CategoryFilterSkeleton = () => (
     <div className="space-y-2">
       {[1, 2, 3, 4, 5].map((i) => (
         <div key={i} className="border-2 rounded-lg p-3 flex items-center gap-3">
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
   ```

   **Statistics Skeleton:**
   ```tsx
   // src/components/Statistics/StatisticsSkeleton.tsx
   export const StatisticsSkeleton = () => (
     <div className="space-y-6">
       <Skeleton className="h-8 w-48 mb-4" />
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[1, 2, 3, 4].map((i) => (
           <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl">
             <Skeleton className="h-10 w-10 mb-2" />
             <Skeleton className="h-6 w-20 mb-1" />
             <Skeleton className="h-4 w-16" />
           </div>
         ))}
       </div>
       <Skeleton className="h-64 w-full rounded-xl" />
     </div>
   );
   ```

   **FlashCard Skeleton:**
   ```tsx
   // src/components/FlashCard/FlashCardSkeleton.tsx
   export const FlashCardSkeleton = () => (
     <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm
                     rounded-3xl p-8 shadow-2xl">
       <Skeleton className="h-12 w-3/4 mx-auto mb-8" />
       <Skeleton className="h-16 w-full rounded-2xl mb-6" />
       <div className="grid grid-cols-4 gap-2">
         {[1, 2, 3, 4].map((i) => (
           <Skeleton key={i} className="h-12 rounded-xl" />
         ))}
       </div>
     </div>
   );
   ```

4. **Implement shimmer effect (optional, more polished):**
   ```tsx
   // Enhanced Skeleton with shimmer
   export const Skeleton: React.FC<SkeletonProps> = ({
     className = '',
     shimmer = true,
   }) => {
     return (
       <div
         className={`
           relative overflow-hidden
           bg-gray-200 dark:bg-gray-700
           ${className}
         `}
       >
         {shimmer && (
           <motion.div
             className="absolute inset-0 bg-gradient-to-r
                        from-transparent via-white/20 to-transparent"
             animate={{
               x: ['-100%', '100%'],
             }}
             transition={{
               repeat: Infinity,
               duration: 1.5,
               ease: 'linear',
             }}
           />
         )}
       </div>
     );
   };
   ```

5. **Update components to use skeletons:**
   ```tsx
   // Example: CategoryFilter.tsx
   import { CategoryFilterSkeleton } from './CategoryFilterSkeleton';

   export const CategoryFilter = () => {
     const { categories, loading } = useCategories();

     if (loading) {
       return <CategoryFilterSkeleton />;
     }

     return (
       <div>
         {/* Actual content */}
       </div>
     );
   };
   ```

6. **Create improved spinner for specific cases:**
   ```tsx
   // src/components/ui/Spinner.tsx
   interface SpinnerProps {
     size?: 'small' | 'medium' | 'large';
     color?: string;
     label?: string;
   }

   export const Spinner: React.FC<SpinnerProps> = ({
     size = 'medium',
     color = 'blue',
     label,
   }) => {
     const sizes = {
       small: 'w-4 h-4',
       medium: 'w-8 h-8',
       large: 'w-16 h-16',
     };

     return (
       <div className="flex flex-col items-center justify-center gap-2">
         <div
           className={`
             ${sizes[size]}
             border-2 border-gray-200 dark:border-gray-700
             border-t-${color}-600
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
   ```

7. **Create loading state patterns:**
   ```tsx
   // Pattern 1: Full page loading
   <div className="min-h-screen flex items-center justify-center">
     <Spinner size="large" label="Loading..." />
   </div>

   // Pattern 2: Section loading with skeleton
   {loading ? <CardSkeleton /> : <Card data={data} />}

   // Pattern 3: Inline loading
   <button disabled={loading}>
     {loading ? <Spinner size="small" /> : 'Submit'}
   </button>

   // Pattern 4: Overlay loading
   <div className="relative">
     {loading && (
       <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80
                       flex items-center justify-center z-10">
         <Spinner label="Processing..." />
       </div>
     )}
     <Content />
   </div>
   ```

8. **Add loading states to key components:**
   - CategoryFilter → CategoryFilterSkeleton
   - Statistics → StatisticsSkeleton
   - Analytics → AnalyticsSkeleton
   - FlashCard → FlashCardSkeleton
   - QuickStats → QuickStatsSkeleton
   - LeitnerBoxVisualizer → LeitnerBoxSkeleton

9. **Implement progressive loading:**
   ```tsx
   // Load critical content first, then secondary
   const Dashboard = () => {
     const { data: criticalData, loading: criticalLoading } = useCriticalData();
     const { data: secondaryData, loading: secondaryLoading } = useSecondaryData();

     return (
       <div>
         {criticalLoading ? <ModeSelectionSkeleton /> : <ModeSelection />}
         {secondaryLoading ? <StatsSkeleton /> : <Stats />}
       </div>
     );
   };
   ```

10. **Add stale-while-revalidate pattern:**
    ```tsx
    // Show old data while fetching new data
    const { data, loading, stale } = useSWR('/api/stats');

    return (
      <div className={stale ? 'opacity-50' : ''}>
        {loading && !data ? <Skeleton /> : <Stats data={data} />}
      </div>
    );
    ```

## Success Criteria
- Skeleton screens implemented for all major loading states
- No jarring content pop-in
- Improved perceived performance
- Consistent loading patterns across application
- Spinner only used where appropriate
- Smooth transitions from loading to loaded
- Positive user feedback

## Testing Checklist
- [ ] Test on slow network (throttle to Slow 3G)
- [ ] Verify skeleton screens match final content layout
- [ ] Check dark mode skeleton appearance
- [ ] Test progressive loading
- [ ] Verify smooth transitions
- [ ] Get user feedback on perceived performance

## References
- UI_Review.md: Section 2.7 - Animation & Interaction Issues: Loading States Lack Polish
- UI_Review.md: Section 3.1 - Quick Win #4: Add Loading Skeletons
- Material Design 3: Progress indicators
- Nielsen Norman Group: Skeleton Screens
