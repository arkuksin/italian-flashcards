# Standardize Inconsistent Card Styles

## Issue
Different components use varying card styles throughout the application, creating visual inconsistency and reducing professional appearance.

## Locations
Multiple components:
- `FlashCard.tsx` (line 76)
- `ModeSelection.tsx` (line 41)
- `CategoryFilter.tsx` (line 217)

## Problem Details

**FlashCard.tsx:**
```tsx
className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm
           border border-gray-200 rounded-3xl p-8 shadow-2xl"
```

**ModeSelection.tsx:**
```tsx
className="bg-white dark:bg-gray-800
           border-2 border-blue-300 rounded-xl p-6 shadow-xl"
```

**CategoryFilter.tsx:**
```tsx
className="border-2 rounded-lg p-3"
```

### Inconsistencies:
- Different border widths (1px vs 2px)
- Different corner radius (lg vs xl vs 2xl vs 3xl)
- Different shadow intensities (none vs md vs lg vs xl vs 2xl)
- Different opacity values (/80 vs /90 vs solid)

## Impact
- Visual inconsistency reduces professional appearance
- Harder to maintain
- Confused design language
- Poor user experience

## Task
Create a standardized Card component system:

1. **Create a reusable Card component**
   - Location: `src/components/ui/Card.tsx`
   - Support multiple variants: `default`, `elevated`, `flat`, `outlined`
   - Support multiple sizes/padding options: `compact`, `default`, `comfortable`
   - Include TypeScript types

2. **Define standard card styles:**
   ```tsx
   default: 'bg-white dark:bg-gray-800 border border-gray-200
             dark:border-gray-700 rounded-xl p-6 shadow-md'
   elevated: 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm
              border border-gray-200 rounded-2xl p-8 shadow-xl'
   flat: 'bg-gray-50 dark:bg-gray-900 rounded-lg p-4'
   outlined: 'border-2 border-gray-300 dark:border-gray-600
              rounded-xl p-6'
   ```

3. **Replace all card instances throughout the codebase:**
   - FlashCard.tsx
   - ModeSelection.tsx
   - CategoryFilter.tsx
   - Statistics.tsx
   - QuickStats.tsx
   - GamificationWidgets.tsx
   - All other components with card-like styling

4. **Document the Card component:**
   - Add JSDoc comments
   - Create usage examples
   - Document when to use each variant

## Success Criteria
- All cards use the standardized Card component
- No ad-hoc card styling in components
- Consistent visual appearance across the application
- Improved maintainability
- Documentation complete

## References
- UI_Review.md: Section 2.1 - Inconsistent Card Styles
- UI_Review.md: Section 3.1 - Quick Win #1: Standardize Card Styles
