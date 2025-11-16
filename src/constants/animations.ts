/**
 * Animation duration constants (in milliseconds)
 * Keep animations fast and purposeful for better UX
 */
export const ANIMATION_DURATIONS = {
  instant: 50,   // Icon state changes
  fast: 100,     // Hover effects
  normal: 200,   // Most transitions (recommended)
  slow: 300,     // Page transitions
  slower: 500,   // Special cases only
} as const;

/**
 * Standard easing functions for consistent animation feel
 * Based on Material Design motion guidelines
 */
export const EASINGS = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
} as const;

/**
 * Animation variants for Framer Motion
 * All variants respect reduced motion preferences
 */
export const createAnimationVariants = (prefersReducedMotion: boolean) => ({
  // Fade in animation
  fadeIn: {
    initial: prefersReducedMotion ? {} : { opacity: 0 },
    animate: prefersReducedMotion ? {} : { opacity: 1 },
    exit: prefersReducedMotion ? {} : { opacity: 0 },
    transition: { duration: ANIMATION_DURATIONS.normal / 1000 },
  },

  // Slide up animation
  slideUp: {
    initial: prefersReducedMotion ? {} : { opacity: 0, y: 20 },
    animate: prefersReducedMotion ? {} : { opacity: 1, y: 0 },
    exit: prefersReducedMotion ? {} : { opacity: 0, y: -20 },
    transition: { duration: ANIMATION_DURATIONS.normal / 1000 },
  },

  // Scale animation (for modals, dialogs)
  scale: {
    initial: prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 },
    animate: prefersReducedMotion ? {} : { opacity: 1, scale: 1 },
    exit: prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 },
    transition: { duration: ANIMATION_DURATIONS.normal / 1000 },
  },
});
