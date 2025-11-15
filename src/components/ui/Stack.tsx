import React from 'react';
import { VERTICAL_SPACING, type VerticalSpacingKey } from '../../constants/spacing';

/**
 * Stack Component
 *
 * A utility component for consistent vertical spacing between child elements.
 * Provides a standardized way to apply vertical rhythm throughout the application.
 *
 * @example
 * ```tsx
 * <Stack spacing="md">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Stack>
 * ```
 *
 * @see docs/ui/08-vertical-spacing-inconsistency.md
 */

export interface StackProps {
  /** Child elements to stack vertically */
  children: React.ReactNode;

  /** Spacing size between elements (defaults to 'md' - 16px) */
  spacing?: VerticalSpacingKey;

  /** Additional CSS classes */
  className?: string;

  /** HTML element type (defaults to 'div') */
  as?: 'div' | 'section' | 'article' | 'main' | 'aside' | 'nav';

  /** ARIA role for accessibility */
  role?: string;

  /** ARIA label for accessibility */
  'aria-label'?: string;
}

/**
 * Stack component for consistent vertical spacing
 */
export const Stack: React.FC<StackProps> = ({
  children,
  spacing = 'md',
  className = '',
  as: Component = 'div',
  role,
  'aria-label': ariaLabel,
}) => {
  const spacingClass = VERTICAL_SPACING[spacing];

  return (
    <Component
      className={`${spacingClass} ${className}`.trim()}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </Component>
  );
};

/**
 * Horizontal Stack Component
 *
 * A utility component for consistent horizontal spacing between child elements.
 *
 * @example
 * ```tsx
 * <HStack spacing="sm">
 *   <button>Cancel</button>
 *   <button>Submit</button>
 * </HStack>
 * ```
 */

export interface HStackProps {
  /** Child elements to stack horizontally */
  children: React.ReactNode;

  /** Gap size between elements */
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /** Additional CSS classes */
  className?: string;

  /** Alignment of items */
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch';

  /** Justification of items */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

  /** Allow wrapping */
  wrap?: boolean;

  /** HTML element type (defaults to 'div') */
  as?: 'div' | 'section' | 'nav';
}

const GAP_CLASSES = {
  xs: 'gap-2',
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
} as const;

const ALIGN_CLASSES = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
} as const;

const JUSTIFY_CLASSES = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
} as const;

/**
 * Horizontal Stack component
 */
export const HStack: React.FC<HStackProps> = ({
  children,
  spacing = 'md',
  className = '',
  align = 'center',
  justify = 'start',
  wrap = false,
  as: Component = 'div',
}) => {
  const gapClass = GAP_CLASSES[spacing];
  const alignClass = ALIGN_CLASSES[align];
  const justifyClass = JUSTIFY_CLASSES[justify];
  const wrapClass = wrap ? 'flex-wrap' : '';

  return (
    <Component
      className={`flex ${gapClass} ${alignClass} ${justifyClass} ${wrapClass} ${className}`.trim()}
    >
      {children}
    </Component>
  );
};

export default Stack;
