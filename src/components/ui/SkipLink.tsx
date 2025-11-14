import React from 'react';

interface SkipLinkProps {
  targetId?: string;
  children?: React.ReactNode;
}

/**
 * A skip link component for keyboard navigation accessibility.
 *
 * This link is visually hidden until focused, allowing keyboard users to skip
 * directly to the main content without tabbing through navigation elements.
 *
 * @param targetId - The id of the element to skip to (default: "main-content")
 * @param children - The text to display in the link (default: "Skip to main content")
 *
 * @example
 * ```tsx
 * <SkipLink />
 *
 * <SkipLink targetId="content">
 *   Skip to content
 * </SkipLink>
 * ```
 */
export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId = 'main-content',
  children = 'Skip to main content',
}) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
                 focus:z-50 px-4 py-2 bg-blue-600 text-white rounded-lg
                 font-medium shadow-lg transition-all"
    >
      {children}
    </a>
  );
};
