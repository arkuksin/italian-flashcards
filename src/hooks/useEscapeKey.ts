import { useEffect } from 'react'

/**
 * Escape Key Hook
 *
 * Provides consistent Escape key behavior across the application.
 * Commonly used for closing modals, dialogs, dropdowns, and other overlay components.
 *
 * This hook ensures WCAG 2.1.2 (No Keyboard Trap) compliance by allowing users
 * to escape from components using the Escape key.
 *
 * @param callback - Function to call when Escape is pressed
 * @param enabled - Whether the hook is active (default: true)
 *
 * @example
 * ```tsx
 * const Modal = ({ onClose, isOpen }) => {
 *   useEscapeKey(onClose, isOpen);
 *
 *   return (
 *     <div role="dialog" aria-modal="true">
 *       <button onClick={onClose}>Close</button>
 *     </div>
 *   );
 * };
 * ```
 */
export const useEscapeKey = (callback: () => void, enabled = true): void => {
  useEffect(() => {
    if (!enabled) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        callback()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [callback, enabled])
}
