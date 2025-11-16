import React from 'react';

/**
 * Typography variants based on Material Design 3
 * @see https://m3.material.io/styles/typography
 */
export type TypographyVariant =
  | 'display-large' | 'display-medium' | 'display-small'
  | 'headline-large' | 'headline-medium' | 'headline-small'
  | 'title-large' | 'title-medium' | 'title-small'
  | 'body-large' | 'body-medium' | 'body-small'
  | 'label-large' | 'label-medium' | 'label-small';

interface TypographyProps {
  /**
   * Typography variant following Material Design 3 scale
   */
  variant: TypographyVariant;

  /**
   * HTML element to render
   * @default 'p'
   */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'label';

  /**
   * Content to render
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Typography component that provides semantic, consistent text styling
 * across the application using Material Design 3 typography scale.
 *
 * @example
 * ```tsx
 * <Typography variant="headline-large" as="h1">
 *   Welcome to Flashcards
 * </Typography>
 *
 * <Typography variant="body-medium">
 *   This is some body text
 * </Typography>
 * ```
 */
export const Typography: React.FC<TypographyProps> = ({
  variant,
  as: Component = 'p',
  children,
  className = '',
}) => {
  // Convert variant to Tailwind class name
  // e.g., 'display-large' -> 'display-lg'
  const variantClass = variant.replace(/-large$/, '-lg')
    .replace(/-medium$/, '-md')
    .replace(/-small$/, '-sm');

  return (
    <Component className={`text-${variantClass} ${className}`.trim()}>
      {children}
    </Component>
  );
};
