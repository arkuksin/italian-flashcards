/**
 * Typography Design Tokens
 * Based on Material Design 3 Typography Scale
 *
 * Provides a consistent, semantic typography system for the application.
 * @see https://m3.material.io/styles/typography
 */

export const typography = {
  // Display - Large, expressive text (hero sections, big headers)
  'display-large': {
    fontSize: '3.5rem',      // 57px
    lineHeight: '4rem',      // 64px
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  'display-medium': {
    fontSize: '2.8rem',      // 45px
    lineHeight: '3.25rem',   // 52px
    fontWeight: '700',
    letterSpacing: '-0.01em',
  },
  'display-small': {
    fontSize: '2.25rem',     // 36px
    lineHeight: '2.75rem',   // 44px
    fontWeight: '700',
    letterSpacing: '0',
  },

  // Headline - High-emphasis text (section headers, card titles)
  'headline-large': {
    fontSize: '2rem',        // 32px
    lineHeight: '2.5rem',    // 40px
    fontWeight: '600',
    letterSpacing: '0',
  },
  'headline-medium': {
    fontSize: '1.75rem',     // 28px
    lineHeight: '2.25rem',   // 36px
    fontWeight: '600',
    letterSpacing: '0',
  },
  'headline-small': {
    fontSize: '1.5rem',      // 24px
    lineHeight: '2rem',      // 32px
    fontWeight: '600',
    letterSpacing: '0',
  },

  // Title - Medium-emphasis text (card headers, list titles)
  'title-large': {
    fontSize: '1.375rem',    // 22px
    lineHeight: '1.75rem',   // 28px
    fontWeight: '500',
    letterSpacing: '0',
  },
  'title-medium': {
    fontSize: '1rem',        // 16px
    lineHeight: '1.5rem',    // 24px
    fontWeight: '500',
    letterSpacing: '0.01em',
  },
  'title-small': {
    fontSize: '0.875rem',    // 14px
    lineHeight: '1.25rem',   // 20px
    fontWeight: '500',
    letterSpacing: '0.01em',
  },

  // Body - Main content text
  'body-large': {
    fontSize: '1rem',        // 16px
    lineHeight: '1.5rem',    // 24px
    fontWeight: '400',
    letterSpacing: '0.01em',
  },
  'body-medium': {
    fontSize: '0.875rem',    // 14px
    lineHeight: '1.25rem',   // 20px
    fontWeight: '400',
    letterSpacing: '0.02em',
  },
  'body-small': {
    fontSize: '0.75rem',     // 12px
    lineHeight: '1rem',      // 16px
    fontWeight: '400',
    letterSpacing: '0.03em',
  },

  // Label - UI elements (buttons, tabs, chips)
  'label-large': {
    fontSize: '0.875rem',    // 14px
    lineHeight: '1.25rem',   // 20px
    fontWeight: '500',
    letterSpacing: '0.01em',
  },
  'label-medium': {
    fontSize: '0.75rem',     // 12px
    lineHeight: '1rem',      // 16px
    fontWeight: '500',
    letterSpacing: '0.05em',
  },
  'label-small': {
    fontSize: '0.6875rem',   // 11px
    lineHeight: '1rem',      // 16px
    fontWeight: '500',
    letterSpacing: '0.05em',
  },
} as const;

export type TypographyVariant = keyof typeof typography;
