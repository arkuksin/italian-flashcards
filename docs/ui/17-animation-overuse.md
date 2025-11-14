# Reduce Animation Overuse

## Issue
Too many simultaneous animations throughout the application can feel gimmicky, cause performance issues on low-end devices, and reduce perceived speed.

## Locations
Multiple components using Framer Motion

## Problem Details

**Examples of animation overuse:**
- Every card animates in with delay
- Buttons have hover scale + tap scale
- Page transitions use fade + slide
- Progress bars animate on every update
- Multiple elements animating simultaneously

### Issues:
1. **Can feel gimmicky** with too many simultaneous animations
2. **Performance issues** on low-end devices
3. **Reduces perceived speed** (everything feels slower)
4. **No `prefers-reduced-motion` support**
5. **Animations don't add value** in many cases

## Impact
- Slower perceived performance
- Performance issues on low-end devices
- Annoying for users who prefer minimal motion
- Accessibility issues (motion sensitivity)
- Reduced battery life on mobile

## Task
Optimize animations for better performance and user experience:

1. **Define animation principles:**
   ```
   Purposeful: Every animation should communicate meaning
   Subtle: Prefer micro-interactions over large effects
   Fast: Keep under 300ms for most interactions
   Accessible: Respect prefers-reduced-motion
   ```

2. **Reserve animations for important state changes:**
   ```tsx
   // Good use cases:
   - Page transitions (subtle)
   - Success/error feedback
   - Modal open/close
   - Important state changes (loading → loaded)
   - Drawer/menu open/close

   // Avoid animating:
   - Every card on page load
   - Every button hover
   - Every minor state change
   - Progress bars (unless showing completion)
   - Elements that appear frequently
   ```

3. **Implement `prefers-reduced-motion` support:**
   ```tsx
   // Create hook
   // src/hooks/useReducedMotion.ts
   import { useEffect, useState } from 'react';

   export const useReducedMotion = () => {
     const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

     useEffect(() => {
       const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
       setPrefersReducedMotion(mediaQuery.matches);

       const handleChange = (e: MediaQueryListEvent) => {
         setPrefersReducedMotion(e.matches);
       };

       mediaQuery.addEventListener('change', handleChange);
       return () => mediaQuery.removeEventListener('change', handleChange);
     }, []);

     return prefersReducedMotion;
   };
   ```

4. **Update components to respect reduced motion:**
   ```tsx
   // Example: AnimatedCard.tsx
   import { motion } from 'framer-motion';
   import { useReducedMotion } from '@/hooks/useReducedMotion';

   export const AnimatedCard = ({ children }) => {
     const prefersReducedMotion = useReducedMotion();

     return (
       <motion.div
         initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
         animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
         transition={{ duration: 0.2 }}
       >
         {children}
       </motion.div>
     );
   };
   ```

5. **Limit animations per screen:**
   ```tsx
   // Don't animate every card with stagger
   // Before (too much)
   <motion.div
     variants={{
       show: {
         transition: {
           staggerChildren: 0.1, // Every child animates
         }
       }
     }}
   >
     {cards.map((card, i) => (
       <motion.div
         key={i}
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: i * 0.1 }}
       />
     ))}
   </motion.div>

   // After (subtle)
   <div>
     {cards.map((card, i) => (
       <div key={i} className="animate-in fade-in-0 duration-200">
         {/* Simple CSS animation */}
       </div>
     ))}
   </div>
   ```

6. **Use faster animation durations:**
   ```tsx
   // Create animation constants
   // src/constants/animations.ts
   export const ANIMATION_DURATIONS = {
     instant: 50,   // Icon state changes
     fast: 100,     // Hover effects
     normal: 200,   // Most transitions (recommended)
     slow: 300,     // Page transitions
     slower: 500,   // Special cases only
   };

   export const EASINGS = {
     standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
     accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
     decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
     sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
   };
   ```

7. **Simplify button animations:**
   ```tsx
   // Before (too much)
   <motion.button
     whileHover={{ scale: 1.05, y: -2 }}
     whileTap={{ scale: 0.95 }}
     transition={{ duration: 0.2 }}
   >

   // After (subtle)
   <motion.button
     whileTap={{ scale: 0.97 }}
     transition={{ duration: 0.1 }}
     className="hover:bg-blue-600 transition-colors duration-150"
   >
   ```

8. **Optimize progress bar animations:**
   ```tsx
   // Don't animate on every small update
   // Use CSS transitions instead of JS animations

   <div className="w-full bg-gray-200 rounded-full h-2">
     <div
       className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
       style={{ width: `${progress}%` }}
     />
   </div>
   ```

9. **Create optimized animation components:**
   ```tsx
   // src/components/ui/animations/PageTransition.tsx
   export const PageTransition = ({ children }: { children: React.ReactNode }) => {
     const prefersReducedMotion = useReducedMotion();

     if (prefersReducedMotion) {
       return <>{children}</>;
     }

     return (
       <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         transition={{ duration: 0.15 }}
       >
         {children}
       </motion.div>
     );
   };
   ```

10. **Add animation toggle in settings (optional):**
    ```tsx
    // Allow users to disable animations
    const [animationsEnabled, setAnimationsEnabled] = useLocalStorage(
      'animations-enabled',
      true
    );

    // Use in components
    const shouldAnimate = animationsEnabled && !prefersReducedMotion;
    ```

11. **Audit and reduce animations:**
    ```bash
    # Find all Framer Motion usage
    grep -r "motion\." src/
    grep -r "whileHover" src/
    grep -r "whileTap" src/
    grep -r "animate" src/

    # Review each and ask:
    - Is this animation necessary?
    - Does it add value?
    - Could it be simpler/faster?
    - Does it respect reduced motion?
    ```

12. **Performance optimization:**
    ```tsx
    // Use transform and opacity only (GPU-accelerated)
    // GOOD
    <motion.div animate={{ opacity: 1, scale: 1, x: 0, y: 0 }} />

    // BAD (causes reflow)
    <motion.div animate={{ width: '100%', height: 200, top: 0 }} />
    ```

13. **Add CSS fallbacks for simple animations:**
    ```css
    /* Use Tailwind's animation utilities where possible */
    @layer utilities {
      .animate-in {
        animation: fadeIn 0.2s ease-out;
      }

      .animate-slide-up {
        animation: slideUp 0.2s ease-out;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    ```

## Success Criteria
- Maximum 2-3 animations per screen
- All animations under 300ms duration
- `prefers-reduced-motion` respected throughout
- Improved perceived performance
- Better performance on low-end devices
- Positive user feedback
- Accessibility audit passes

## Testing Checklist
- [ ] Enable `prefers-reduced-motion` in OS settings and verify
- [ ] Test on low-end devices
- [ ] Check performance with Chrome DevTools Performance tab
- [ ] Verify no jank or frame drops
- [ ] Get user feedback on animation amount
- [ ] Test battery impact on mobile
- [ ] Verify animations feel purposeful, not decorative

## References
- UI_Review.md: Section 2.7 - Animation & Interaction Issues: Animation Overuse
- WCAG 2.3.3: Animation from Interactions
- Web Animations API Performance Best Practices
- CSS-Tricks: prefers-reduced-motion
