import React from 'react';

interface FocusableBaseProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'inset' | 'thin';
}

type FocusableProps<T extends keyof JSX.IntrinsicElements = 'div'> = FocusableBaseProps & {
  as?: T;
} & Omit<React.ComponentPropsWithoutRef<T>, keyof FocusableBaseProps | 'as'>;

/**
 * A wrapper component that applies consistent focus styles to its children.
 *
 * @param children - The content to render
 * @param className - Additional CSS classes to apply
 * @param variant - The focus ring variant: 'default' (standard), 'inset' (for inputs), or 'thin' (for compact elements)
 * @param as - The HTML element to render (default: 'div')
 *
 * @example
 * ```tsx
 * <Focusable variant="default">
 *   <button>Click me</button>
 * </Focusable>
 *
 * <Focusable variant="inset" as="span">
 *   <input />
 * </Focusable>
 * ```
 */
export const Focusable = <T extends keyof JSX.IntrinsicElements = 'div'>({
  children,
  className = '',
  variant = 'default',
  as,
  ...props
}: FocusableProps<T>) => {
  const Component = (as || 'div') as keyof JSX.IntrinsicElements;

  const focusClasses = {
    default: 'focus-ring',
    inset: 'focus-ring-inset',
    thin: 'focus-ring-thin',
  };

  return (
    <Component className={`${focusClasses[variant]} ${className}`} {...props}>
      {children}
    </Component>
  );
};
