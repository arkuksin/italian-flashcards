import React from 'react';

interface AriaLabelProps {
  children: React.ReactNode;
  label: string;
  role?: string;
  className?: string;
}

/**
 * AriaLabel component wraps children with appropriate ARIA attributes
 * for accessibility. Commonly used for emojis and icons that need
 * screen reader descriptions.
 *
 * @example
 * <AriaLabel label="Russian language">🇷🇺</AriaLabel>
 * <AriaLabel label="Success" role="img">✅</AriaLabel>
 */
export const AriaLabel: React.FC<AriaLabelProps> = ({
  children,
  label,
  role = 'img',
  className = '',
}) => (
  <span role={role} aria-label={label} className={className}>
    {children}
  </span>
);
