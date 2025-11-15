# Modernize Input Field Design

## Issue
Current input design feels dated with heavy borders. It lacks modern patterns like floating labels, visual interest when focused, and optimal touch targets for mobile.

## Location
`FlashCard.tsx` (lines 130-152)

## Problem Details

**Current input design:**
```tsx
<input
  className="w-full px-6 py-4 text-lg border-2 border-gray-300
             rounded-2xl bg-white focus:border-blue-500"
/>
```

### Issues:
1. **Border-heavy design** feels dated (2024 trend: subtle borders or no borders)
2. **Submit button inside input** is small (right-positioned icon)
3. **No floating label pattern**
4. **Lacks visual interest** when focused
5. **Not optimized** for Material 3 / Fluent 2 modern patterns

## Impact
- Dated visual appearance
- Less engaging user experience
- Not following modern design trends
- Missed opportunity for polish

## Task
Implement modern Material 3 style input field:

1. **Create a new TextField component:**
   - Location: `src/components/ui/TextField.tsx`
   - Support variants: `filled` (recommended), `outlined`
   - Support sizes: `small`, `medium`, `large`
   - Include floating label animation

2. **Implement filled input style (Material 3):**
   ```tsx
   <div className="relative">
     <input
       value={value}
       onChange={onChange}
       className="peer w-full px-4 pt-6 pb-2 text-base
                  bg-gray-100 dark:bg-gray-800
                  border-b-2 border-gray-300 dark:border-gray-600
                  rounded-t-xl
                  focus:border-blue-500 focus:bg-gray-50
                  dark:focus:bg-gray-900
                  transition-all"
       placeholder=" "
     />
     <label className="absolute left-4 top-4 text-gray-500
                       pointer-events-none transition-all
                       peer-focus:top-2 peer-focus:text-xs
                       peer-focus:text-blue-500
                       peer-[:not(:placeholder-shown)]:top-2
                       peer-[:not(:placeholder-shown)]:text-xs">
       {label}
     </label>
   </div>
   ```

3. **Features to include:**
   - Floating label animation
   - No heavy borders (filled style with bottom border only)
   - Clear focus state (border color change + background lightening)
   - Dark mode support
   - Larger touch targets for mobile (min height: 56px)
   - Optional leading/trailing icons
   - Helper text support
   - Error state styling

4. **Replace input in FlashCard.tsx:**
   - Use new TextField component
   - Maintain all existing functionality
   - Ensure keyboard shortcuts still work
   - Test on mobile devices

5. **Update submit button:**
   - Make it larger (at least 48×48px)
   - Consider placing it outside the input (below or to the side on mobile)
   - Or: use a floating action button style

## Success Criteria
- Modern, polished input appearance
- Smooth floating label animation
- Improved focus states
- Better mobile experience
- Maintains all existing functionality
- Positive user feedback

## References
- UI_Review.md: Section 2.2 - Component-Level Issues: Input Field Design
- UI_Review.md: Section 3.2 - Medium-Term Improvement #3: Modernize Input Fields
- Material Design 3: Text Fields (https://m3.material.io/components/text-fields)
