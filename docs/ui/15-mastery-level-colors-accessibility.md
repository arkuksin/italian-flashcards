# Fix Mastery Level Colors Accessibility

## Issue
Mastery level bars use yellow color (Level 3) with poor contrast on white background (~2:1 ratio), violating WCAG accessibility guidelines.

## Location
`FlashCard.tsx` (lines 47-57)

## Problem Details

**Current mastery level colors:**
- Level 0: Gray ✓
- Level 1: Red ✓
- Level 2: Orange ✓
- Level 3: Yellow ⚠️ **Poor contrast**
- Level 4: Green ✓
- Level 5: Blue ✓

**Problem code:**
```tsx
// Level 3 (Yellow)
'bg-yellow-200 dark:bg-yellow-900/50' // Too light on white background
```

### Issues:
1. **Yellow-200 on white background** = poor contrast (~2:1 ratio)
2. **WCAG AA requires 4.5:1** minimum for normal text, 3:1 for large text
3. **Difficult to see** for users with low vision
4. **Not accessible** for users with certain color vision deficiencies

## Impact
- Accessibility violation (WCAG failure)
- Difficult to distinguish mastery levels
- Poor user experience for users with visual impairments
- Potential legal/compliance issues

## Task
Fix color contrast issues for mastery level indicators:

1. **Update Level 3 (Yellow) to darker shade:**
   ```tsx
   // Before
   level === 3: 'bg-yellow-200 dark:bg-yellow-900/50'

   // After - better contrast
   level === 3: 'bg-yellow-400 dark:bg-yellow-900/50'

   // Or even darker for better accessibility
   level === 3: 'bg-yellow-500 dark:bg-yellow-800'
   ```

2. **Test all mastery level colors for contrast:**
   ```tsx
   // Recommended mastery level colors (light mode)
   const masteryColors = {
     0: 'bg-gray-300 dark:bg-gray-700',    // New/Not started
     1: 'bg-red-500 dark:bg-red-800',      // Learning (hard)
     2: 'bg-orange-500 dark:bg-orange-800', // Familiar
     3: 'bg-yellow-500 dark:bg-yellow-800', // Known (better contrast)
     4: 'bg-green-500 dark:bg-green-800',   // Well-known
     5: 'bg-blue-500 dark:bg-blue-800',     // Mastered
   };
   ```

3. **Verify contrast ratios:**
   ```
   Test against backgrounds:
   - Light mode: white (#ffffff)
   - Dark mode: dark gray (#1f2937)

   Minimum requirements:
   - WCAG AA: 4.5:1 for text, 3:1 for large text/UI components
   - WCAG AAA: 7:1 for text, 4.5:1 for large text

   Target: WCAG AA minimum
   ```

4. **Update all mastery level color references:**

   Find all instances:
   ```bash
   # Search for mastery level color usage
   grep -r "bg-yellow-200" src/
   grep -r "mastery" src/
   ```

   Update in:
   - `FlashCard.tsx`
   - `LeitnerBoxVisualizer.tsx`
   - `ProgressBar.tsx` (if exists)
   - Any other components showing mastery levels

5. **Create centralized mastery color constants:**
   ```tsx
   // src/constants/masteryColors.ts
   export const MASTERY_COLORS = {
     0: {
       light: 'bg-gray-300 border-gray-400',
       dark: 'dark:bg-gray-700 dark:border-gray-600',
       label: 'New',
       rgb: { r: 209, g: 213, b: 219 }, // For contrast checking
     },
     1: {
       light: 'bg-red-500 border-red-600',
       dark: 'dark:bg-red-800 dark:border-red-700',
       label: 'Learning',
       rgb: { r: 239, g: 68, b: 68 },
     },
     2: {
       light: 'bg-orange-500 border-orange-600',
       dark: 'dark:bg-orange-800 dark:border-orange-700',
       label: 'Familiar',
       rgb: { r: 249, g: 115, b: 22 },
     },
     3: {
       light: 'bg-yellow-500 border-yellow-600',  // Fixed contrast
       dark: 'dark:bg-yellow-800 dark:border-yellow-700',
       label: 'Known',
       rgb: { r: 234, g: 179, b: 8 },
     },
     4: {
       light: 'bg-green-500 border-green-600',
       dark: 'dark:bg-green-800 dark:border-green-700',
       label: 'Well-known',
       rgb: { r: 34, g: 197, b: 94 },
     },
     5: {
       light: 'bg-blue-500 border-blue-600',
       dark: 'dark:bg-blue-800 dark:border-blue-700',
       label: 'Mastered',
       rgb: { r: 59, g: 130, b: 246 },
     },
   };

   // Helper function
   export const getMasteryColor = (level: number) => {
     return `${MASTERY_COLORS[level].light} ${MASTERY_COLORS[level].dark}`;
   };
   ```

6. **Add visual indicators beyond color:**
   ```tsx
   // Don't rely on color alone - add patterns/icons
   const MasteryIndicator = ({ level }: { level: number }) => (
     <div className={`relative ${getMasteryColor(level)} p-2 rounded`}>
       {/* Color */}
       <div className="w-full h-full" />

       {/* Pattern overlay for accessibility */}
       {level >= 3 && (
         <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, currentColor 4px, currentColor 8px)' }}
         />
       )}

       {/* Icon for additional clarity */}
       <span className="sr-only">{MASTERY_COLORS[level].label}</span>
     </div>
   );
   ```

7. **Test with accessibility tools:**
   ```bash
   # Tools to use:
   - Chrome DevTools: Lighthouse accessibility
   - axe DevTools browser extension
   - WAVE browser extension
   - WebAIM Contrast Checker
   - Color Oracle (color blindness simulator)
   ```

8. **Document color usage:**
   ```markdown
   # Mastery Level Colors

   All mastery level colors meet WCAG AA contrast requirements:

   - Level 0 (New): Gray-300 (contrast ratio: 4.8:1)
   - Level 1 (Learning): Red-500 (contrast ratio: 5.3:1)
   - Level 2 (Familiar): Orange-500 (contrast ratio: 4.6:1)
   - Level 3 (Known): Yellow-500 (contrast ratio: 4.5:1) ✓ Fixed
   - Level 4 (Well-known): Green-500 (contrast ratio: 4.9:1)
   - Level 5 (Mastered): Blue-500 (contrast ratio: 5.2:1)
   ```

## Success Criteria
- All mastery colors meet WCAG AA contrast requirements (3:1 minimum)
- Yellow level (3) has adequate contrast on white background
- Centralized color constants implemented
- All components using mastery colors updated
- Accessibility audit passes
- Testing with color blindness simulators shows distinguishable levels
- Documentation updated

## Testing Checklist
- [ ] Check contrast ratios with WebAIM Contrast Checker
- [ ] Run Lighthouse accessibility audit
- [ ] Test with axe DevTools
- [ ] Test with WAVE extension
- [ ] Simulate color blindness (Color Oracle)
- [ ] Test in light and dark mode
- [ ] Verify on actual devices
- [ ] Get feedback from users with visual impairments

## References
- UI_Review.md: Section 2.6 - Color & Contrast Issues: Mastery Level Colors Accessibility
- WCAG 2.1: Contrast (Minimum) - https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Color Oracle (color blindness simulator): https://colororacle.org/
