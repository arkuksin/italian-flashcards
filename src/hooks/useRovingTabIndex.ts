import { useState, useCallback } from 'react'

/**
 * Roving TabIndex Hook
 *
 * Implements the roving tabindex pattern for keyboard navigation in grids and lists.
 * This pattern allows users to navigate through items using arrow keys while maintaining
 * a single tab stop in the tab order.
 *
 * Features:
 * - Arrow key navigation (Up, Down, Left, Right)
 * - Home/End key support
 * - Grid layout support with configurable columns
 * - Optional looping when reaching boundaries
 * - Automatic focus management
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 */

interface UseRovingTabIndexProps {
  /** Total number of items in the grid/list */
  itemCount: number
  /** Number of columns in grid layout (1 for list) */
  columns?: number
  /** Whether to loop from last to first item and vice versa */
  loop?: boolean
}

interface UseRovingTabIndexReturn {
  /** Current focused item index */
  currentIndex: number
  /** Update the current focused index */
  setCurrentIndex: (index: number) => void
  /** Handle keyboard navigation events */
  handleKeyDown: (e: React.KeyboardEvent, index: number) => void
}

export const useRovingTabIndex = ({
  itemCount,
  columns = 1,
  loop = true,
}: UseRovingTabIndexProps): UseRovingTabIndexReturn => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let nextIndex = index

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          nextIndex = index + 1
          if (nextIndex >= itemCount) {
            nextIndex = loop ? 0 : itemCount - 1
          }
          break

        case 'ArrowLeft':
          e.preventDefault()
          nextIndex = index - 1
          if (nextIndex < 0) {
            nextIndex = loop ? itemCount - 1 : 0
          }
          break

        case 'ArrowDown':
          e.preventDefault()
          nextIndex = index + columns
          if (nextIndex >= itemCount) {
            nextIndex = loop ? nextIndex % columns : index
          }
          break

        case 'ArrowUp':
          e.preventDefault()
          nextIndex = index - columns
          if (nextIndex < 0) {
            // Calculate the last item in the same column
            const column = index % columns
            const lastRow = Math.floor((itemCount - 1) / columns)
            const potentialIndex = lastRow * columns + column
            nextIndex = loop
              ? potentialIndex >= itemCount
                ? potentialIndex - columns
                : potentialIndex
              : index
          }
          break

        case 'Home':
          e.preventDefault()
          nextIndex = 0
          break

        case 'End':
          e.preventDefault()
          nextIndex = itemCount - 1
          break

        default:
          return
      }

      if (nextIndex >= 0 && nextIndex < itemCount && nextIndex !== index) {
        setCurrentIndex(nextIndex)
        // Focus the element after state update
        requestAnimationFrame(() => {
          const elements = document.querySelectorAll('[role="gridcell"], [role="option"]')
          const element = elements[nextIndex] as HTMLElement
          element?.focus()
        })
      }
    },
    [itemCount, columns, loop]
  )

  return { currentIndex, setCurrentIndex, handleKeyDown }
}
