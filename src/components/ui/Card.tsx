import React from 'react';

/**
 * Card component variants
 * - default: Standard card with border, shadow, and padding
 * - elevated: Card with backdrop blur effect for emphasis (use for main content)
 * - flat: Minimal card without border or shadow (use for grouped items)
 * - outlined: Card with prominent border, no shadow (use for selections)
 */
export type CardVariant = 'default' | 'elevated' | 'flat' | 'outlined';

/**
 * Card component sizes/padding options
 * - compact: Minimal padding (p-4) for dense layouts
 * - default: Standard padding (p-6) for most use cases
 * - comfortable: Generous padding (p-8) for hero/featured content
 */
export type CardSize = 'compact' | 'default' | 'comfortable';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant of the card */
  variant?: CardVariant;
  /** Padding/size of the card */
  size?: CardSize;
  /** Additional CSS classes */
  className?: string;
  /** Card content */
  children: React.ReactNode;
  /** Component to render as (e.g., motion.div) */
  as?: React.ElementType;
}

/**
 * Standardized Card component for consistent styling across the application.
 *
 * @example
 * ```tsx
 * // Default card
 * <Card>Content here</Card>
 *
 * // Elevated card for main content
 * <Card variant="elevated" size="comfortable">
 *   <h2>Important Content</h2>
 * </Card>
 *
 * // Flat card for grouped items
 * <Card variant="flat" size="compact">
 *   List item
 * </Card>
 *
 * // Outlined card for selections
 * <Card variant="outlined">
 *   Selection option
 * </Card>
 * ```
 *
 * ## When to use each variant:
 * - **default**: General-purpose cards, content containers
 * - **elevated**: Hero content, flashcards, primary interactive elements
 * - **flat**: List items, grouped content, subtle backgrounds
 * - **outlined**: Selectable items, mode selection, filter options
 */
export const Card: React.FC<CardProps> = ({
  variant = 'default',
  size = 'default',
  className = '',
  children,
  as: Component = 'div',
  ...props
}) => {
  const variantStyles: Record<CardVariant, string> = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md',
    elevated: 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl',
    flat: 'bg-gray-50 dark:bg-gray-900 rounded-lg',
    outlined: 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl',
  };

  const sizeStyles: Record<CardSize, string> = {
    compact: 'p-4',
    default: 'p-6',
    comfortable: 'p-8',
  };

  const combinedClassName = [
    variantStyles[variant],
    sizeStyles[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <Component className={combinedClassName} {...props}>
      {children}
    </Component>
  );
};
