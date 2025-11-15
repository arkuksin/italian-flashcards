import React from 'react'

/**
 * Skip Link Component
 *
 * Provides a hidden link that becomes visible on focus, allowing keyboard users
 * to quickly skip to the main content area. This improves accessibility by
 * meeting WCAG 2.4.1 (Bypass Blocks) requirement.
 *
 * The link is:
 * - Hidden by default (sr-only)
 * - Visible when focused (keyboard navigation)
 * - Positioned at the top of the page
 * - Styled to stand out when visible
 */
export const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute
                 focus:top-4 focus:left-4 focus:z-50
                 focus:px-4 focus:py-2 focus:rounded-lg
                 focus:bg-blue-600 focus:text-white
                 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 focus:font-medium focus:shadow-lg
                 transition-all"
    >
      Skip to main content
    </a>
  )
}
