# Improve Difficulty Rating Buttons

## Issue
The 4-button grid for difficulty ratings becomes too narrow on mobile devices, making buttons difficult to tap accurately. Color meanings are not immediately clear, and there's no visual indication of how ratings affect learning.

## Location
`FlashCard.tsx` (lines 206-263)

## Problem Details

**Current design:**
```tsx
<div className="grid grid-cols-4 gap-2">
  {/* 4 colored buttons: Again, Hard, Good, Easy */}
</div>
```

### Issues:
1. **Mobile layout:** Buttons become narrow on small screens (difficult to tap accurately)
2. **Color meanings:** Not immediately clear (red = bad, green = good?)
3. **Labels:** Could be more descriptive
4. **No feedback:** No visual indication of consequence (how does rating affect learning?)
5. **Accessibility:** Touch targets may be too small

## Impact
- Poor mobile user experience
- Inaccurate taps leading to wrong ratings
- Confusing color semantics
- Users don't understand impact of ratings

## Task
Redesign difficulty rating buttons for better usability:

1. **Implement responsive grid layout:**
   ```tsx
   // Mobile: 2×2 grid
   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

   // Desktop: 1×4 grid (current)
   ```

2. **Add icons to buttons for clarity:**
   ```tsx
   - Again: 👎 or ❌ icon
   - Hard: 😐 or 🤔 icon
   - Good: 🙂 or ✓ icon
   - Easy: 😊 or ⭐ icon
   ```

3. **Improve button touch targets:**
   - Minimum button height: 56px (mobile)
   - Minimum button width: adequate for 2-column layout
   - Ensure gap between buttons is sufficient (12px+)

4. **Add micro-feedback on tap:**
   - Confetti animation for "Easy" rating
   - Subtle shake for "Again" rating
   - Scale animation on tap (already exists, ensure it's prominent)
   - Optional: Haptic feedback on mobile

5. **Add tooltips explaining rating impact:**
   ```tsx
   Again: "Review this card soon (same session)"
   Hard: "Show again in a few minutes"
   Good: "Show again in ~1 day"
   Easy: "Show again in several days"
   ```

6. **Enhance button styling:**
   - Larger, more prominent buttons
   - Clear color meanings (maintain semantic colors)
   - Add subtle icon + label pairing
   - Improve hover/active states

7. **Implementation example:**
   ```tsx
   <motion.button
     className="flex flex-col items-center justify-center
                min-h-[56px] px-4 py-3 rounded-xl
                bg-red-500 text-white font-semibold
                hover:bg-red-600 active:scale-95
                transition-all"
     whileTap={{ scale: 0.9 }}
     onTouchStart={() => navigator.vibrate?.(10)}
     onClick={() => {
       if (rating === 4) setConfetti(true);
       onDifficultyRating(rating);
     }}
   >
     <span className="text-2xl mb-1">👎</span>
     <span className="text-sm">Again</span>
   </motion.button>
   ```

8. **Optional: Add success sounds**
   - Play subtle sound on "Easy" rating
   - Include mute toggle in settings
   - Ensure sounds are pleasant and not annoying

## Success Criteria
- Buttons are easy to tap on all devices (especially mobile)
- Color meanings are clear and intuitive
- Tooltips explain the impact of each rating
- Micro-feedback enhances the experience
- Touch targets meet accessibility guidelines (44×44px minimum)
- Improved user testing results

## References
- UI_Review.md: Section 2.2 - Component-Level Issues: Difficulty Rating Buttons
- UI_Review.md: Section 3.2 - Medium-Term Improvement #4: Add Micro-Interactions
- Material Design 3: Buttons
- Apple HIG: Touch targets
