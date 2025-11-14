/**
 * Standardized Spacing Scale
 *
 * Provides semantic spacing tokens for consistent vertical and horizontal spacing
 * throughout the application. Use these constants instead of arbitrary Tailwind values.
 *
 * @see docs/ui/08-vertical-spacing-inconsistency.md
 */

/**
 * Spacing scale with semantic names
 */
export const SPACING = {
  /** 8px - Related small elements, icons + text */
  micro: 'gap-2',

  /** 12px - List items, form field groups */
  compact: 'space-y-3',

  /** 16px - Internal card spacing, form fields */
  element: 'space-y-4',

  /** 24px - Card content sections, reading areas */
  comfortable: 'space-y-6',

  /** 32px - Between cards, dashboard widgets */
  stack: 'space-y-8',

  /** 40px - Major page sections, navigation separation */
  section: 'mb-10',

  /** 48px - Large page divisions, header + content */
  page: 'mb-12',

  /** 64px - Distinct page areas, hero sections */
  large: 'mb-16',
} as const;

/**
 * Vertical spacing utilities
 */
export const VERTICAL_SPACING = {
  /** 8px - Related small elements */
  xs: 'space-y-2',

  /** 12px - List items, compact sections */
  sm: 'space-y-3',

  /** 16px - Default spacing for most elements */
  md: 'space-y-4',

  /** 24px - Comfortable spacing for content sections */
  lg: 'space-y-6',

  /** 32px - Between major components */
  xl: 'space-y-8',

  /** 40px - Between page sections */
  '2xl': 'space-y-10',

  /** 48px - Large page divisions */
  '3xl': 'space-y-12',
} as const;

/**
 * Gap utilities for flex/grid layouts
 */
export const GAP = {
  /** 8px - Tight spacing for related items */
  xs: 'gap-2',

  /** 12px - Default gap for form elements */
  sm: 'gap-3',

  /** 16px - Comfortable gap for buttons, inputs */
  md: 'gap-4',

  /** 24px - Spacious gap for larger elements */
  lg: 'gap-6',

  /** 32px - Large gap between major elements */
  xl: 'gap-8',
} as const;

/**
 * Margin bottom utilities for section separation
 */
export const MARGIN_BOTTOM = {
  /** 8px - Small separator */
  xs: 'mb-2',

  /** 12px - Compact separator */
  sm: 'mb-3',

  /** 16px - Default separator */
  md: 'mb-4',

  /** 24px - Comfortable separator */
  lg: 'mb-6',

  /** 32px - Large separator between sections */
  xl: 'mb-8',

  /** 40px - Extra large separator */
  '2xl': 'mb-10',

  /** 48px - Page section separator */
  '3xl': 'mb-12',

  /** 64px - Major page division */
  '4xl': 'mb-16',
} as const;

/**
 * Padding utilities for card/container internal spacing
 */
export const PADDING = {
  /** 12px - Compact padding */
  compact: 'p-3',

  /** 16px - Default padding */
  default: 'p-4',

  /** 24px - Comfortable padding (standard card) */
  comfortable: 'p-6',

  /** 32px - Spacious padding */
  spacious: 'p-8',
} as const;

/**
 * Common spacing patterns for specific use cases
 */
export const SPACING_PATTERNS = {
  /** Spacing for card content sections */
  cardSection: 'mb-4',

  /** Spacing between cards in a list */
  cardStack: 'space-y-4',

  /** Spacing for form fields */
  formField: 'mb-4',

  /** Spacing between form sections */
  formSection: 'mb-6',

  /** Spacing for list items */
  listItem: 'mb-2',

  /** Spacing for label to input */
  labelToInput: 'mb-2',

  /** Spacing for section headers */
  sectionHeader: 'mb-6',

  /** Spacing for page headers */
  pageHeader: 'mb-8',

  /** Gap between buttons in a group */
  buttonGroup: 'gap-3',

  /** Gap between icon and text */
  iconText: 'gap-2',
} as const;

/**
 * Type exports for TypeScript autocomplete
 */
export type SpacingKey = keyof typeof SPACING;
export type VerticalSpacingKey = keyof typeof VERTICAL_SPACING;
export type GapKey = keyof typeof GAP;
export type MarginBottomKey = keyof typeof MARGIN_BOTTOM;
export type PaddingKey = keyof typeof PADDING;
export type SpacingPatternKey = keyof typeof SPACING_PATTERNS;
