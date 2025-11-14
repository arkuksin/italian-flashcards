import React from 'react';

/**
 * GradientText Component
 *
 * A reusable component for gradient text with proper fallbacks for accessibility
 * and browser compatibility.
 *
 * IMPORTANT: Only use for decorative elements, NOT for:
 * - Navigation links
 * - Button text
 * - Form labels
 * - Critical information
 * - Body text
 *
 * Use solid colors for all critical text to ensure accessibility.
 */
interface GradientTextProps {
  /** Text content to display */
  children: React.ReactNode;
  /** Tailwind gradient start color class (e.g., 'from-blue-600') */
  from?: string;
  /** Tailwind gradient end color class (e.g., 'to-purple-600') */
  to?: string;
  /** Dark mode gradient start color (e.g., 'dark:from-blue-400') */
  darkFrom?: string;
  /** Dark mode gradient end color (e.g., 'dark:to-purple-400') */
  darkTo?: string;
  /** Fallback solid color for browsers that don't support bg-clip-text */
  fallbackColor?: string;
  /** Additional CSS classes */
  className?: string;
}

export const GradientText: React.FC<GradientTextProps> = ({
  children,
  from = 'from-blue-700',
  to = 'to-purple-700',
  darkFrom = 'dark:from-blue-400',
  darkTo = 'dark:to-purple-400',
  fallbackColor = 'text-blue-600 dark:text-blue-400',
  className = '',
}) => {
  return (
    <span
      className={`
        ${fallbackColor}
        bg-gradient-to-r ${from} ${to} ${darkFrom} ${darkTo}
        bg-clip-text
        supports-[background-clip:text]:text-transparent
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </span>
  );
};
