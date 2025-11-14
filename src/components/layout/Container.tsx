import React from 'react'

/**
 * Container Width Types
 *
 * Standardized layout width tokens for consistent UI across the application:
 * - content: 896px (max-w-4xl) - For reading/forms
 * - dashboard: 1024px (max-w-5xl) - For cards/grids
 * - analytics: 1152px (max-w-6xl) - For charts/data
 * - wide: 1280px (max-w-7xl) - For full-width layouts
 */
export type ContainerWidth = 'content' | 'dashboard' | 'analytics' | 'wide'

export interface ContainerProps {
  /**
   * Width variant to use
   * @default 'dashboard'
   */
  width?: ContainerWidth
  /**
   * Content to render inside the container
   */
  children: React.ReactNode
  /**
   * Additional CSS classes to apply
   */
  className?: string
  /**
   * HTML element to render as
   * @default 'div'
   */
  as?: keyof JSX.IntrinsicElements
}

/**
 * Container Component
 *
 * Provides standardized maximum width containers for consistent layout across pages.
 *
 * Usage guidelines:
 * - Use 'content' width for: Forms, reading content, single-column layouts (Login, Profile, Settings)
 * - Use 'dashboard' width for: Card grids, dashboard views, mode selection
 * - Use 'analytics' width for: Charts, wide data tables, analytics views
 * - Use 'wide' width for: Full-width layouts, complex grids, admin panels
 *
 * @example
 * ```tsx
 * <Container width="content">
 *   <LoginForm />
 * </Container>
 *
 * <Container width="dashboard">
 *   <ModeSelection />
 * </Container>
 * ```
 */
export const Container: React.FC<ContainerProps> = ({
  width = 'dashboard',
  children,
  className = '',
  as: Component = 'div',
}) => {
  const widthClasses: Record<ContainerWidth, string> = {
    content: 'max-w-4xl',
    dashboard: 'max-w-5xl',
    analytics: 'max-w-6xl',
    wide: 'max-w-7xl',
  }

  return (
    <Component className={`${widthClasses[width]} mx-auto px-4 ${className}`}>
      {children}
    </Component>
  )
}
