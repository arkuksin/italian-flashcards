# Improve ModeSelection Card Touch Targets

## Issue
On very small phones (<375px), the ModeSelection card text can wrap awkwardly, and touch targets may not be optimal.

## Location
`ModeSelection.tsx` (lines 38-83)

## Problem Details

**Current styling:**
```tsx
<div className="p-4 md:p-6">
  <span className="text-lg md:text-2xl">
    {/* Text can wrap awkwardly on small screens */}
  </span>
</div>
```

### Issues:
1. **Text wrapping** awkward on very small phones (<375px)
2. **Inconsistent card heights** due to text wrapping
3. **Touch targets** could be more consistent
4. **Font size** doesn't scale fluidly

## Impact
- Poor experience on small devices (iPhone SE, small Android phones)
- Inconsistent visual appearance
- Potential tap accuracy issues
- Text readability issues

## Task
Improve ModeSelection cards for better mobile experience:

1. **Add minimum height for consistency:**
   ```tsx
   <button className="min-h-[120px] p-5 md:p-6 w-full
                      flex flex-col items-center justify-center
                      rounded-xl border-2 transition-all">
     {/* Content */}
   </button>
   ```

2. **Implement fluid typography:**
   ```tsx
   // Instead of fixed responsive sizes:
   <span className="text-lg md:text-2xl">

   // Use clamp for smooth scaling:
   <span style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)' }}>
   ```

3. **Prevent awkward text wrapping:**
   ```tsx
   // Option 1: Prevent wrapping
   <span className="text-center whitespace-nowrap">
     🇷🇺 → 🇮🇹
   </span>

   // Option 2: Control wrapping
   <span className="text-center max-w-[200px]">
     Russian to Italian
   </span>

   // Option 3: Responsive text
   <span className="text-center">
     <span className="hidden sm:inline">Russian to Italian</span>
     <span className="sm:hidden">🇷🇺 → 🇮🇹</span>
   </span>
   ```

4. **Ensure adequate touch targets:**
   ```tsx
   // Minimum card dimensions
   <button className="min-h-[120px] min-w-[140px] sm:min-w-[180px]
                      p-5 rounded-xl">
   ```

5. **Improve card layout for small screens:**
   ```tsx
   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
     <ModeCard />
     <ModeCard />
   </div>
   ```

6. **Add responsive padding and spacing:**
   ```tsx
   <div className="space-y-3 sm:space-y-4">
     <div className="text-3xl sm:text-4xl md:text-5xl">
       {emoji}
     </div>
     <div className="text-base sm:text-lg md:text-xl font-semibold">
       {label}
     </div>
   </div>
   ```

7. **Use CSS custom properties for fluid scaling:**
   ```css
   /* Add to component or global styles */
   .mode-card {
     --card-padding: clamp(1rem, 3vw, 1.5rem);
     --font-size: clamp(1rem, 4vw, 1.5rem);
     --emoji-size: clamp(2rem, 8vw, 3rem);

     padding: var(--card-padding);
     font-size: var(--font-size);
   }
   ```

8. **Test on various device sizes:**
   - iPhone SE (375px width)
   - Small Android phones (360px width)
   - Standard phones (390-428px width)
   - Tablets (768px+ width)

9. **Consider icon-first approach on very small screens:**
   ```tsx
   <button className="min-h-[120px] p-4 flex flex-col items-center justify-center">
     <span className="text-4xl mb-2">{emoji}</span>
     <span className="text-sm sm:text-base md:text-lg font-semibold text-center">
       {label}
     </span>
     <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">
       {description}
     </span>
   </button>
   ```

## Success Criteria
- Cards display properly on all device sizes (≥320px width)
- No awkward text wrapping
- Consistent card heights
- Touch targets meet accessibility guidelines
- Fluid typography scales smoothly
- Visual balance maintained across breakpoints
- Testing on real devices confirms improvements

## Testing Checklist
- [ ] iPhone SE (375×667px)
- [ ] Small Android (360×640px)
- [ ] iPhone 12/13 (390×844px)
- [ ] iPhone 12/13 Pro Max (428×926px)
- [ ] iPad (768×1024px)
- [ ] Desktop (1280px+ width)

## References
- UI_Review.md: Section 2.4 - Mobile & Responsive Issues: ModeSelection Card Touch Targets
- CSS-Tricks: Fluid Typography
- Apple HIG: Touch targets and responsive design
