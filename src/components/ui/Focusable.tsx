import React from 'react';

interface FocusableProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'inset' | 'thin';
  as?: keyof JSX.IntrinsicElements;
  [key: string]: any;
}

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
export const Focusable: React.FC<FocusableProps> = ({
  children,
  className = '',
  variant = 'default',
  as: Component = 'div',
  ...props
}) => {
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
