import { useEffect } from 'react'

/**
 * Global Keyboard Shortcuts Hook
 *
 * Provides application-level keyboard shortcuts that work across the entire app.
 * Shortcuts are disabled when user is typing in input fields to avoid conflicts.
 *
 * Shortcuts:
 * - ?: Show keyboard shortcuts help
 * - Ctrl/Cmd + K: Open search (if search feature exists)
 *
 * Note: Component-specific shortcuts (flashcard controls) are handled by useKeyboard hook.
 *
 * @param onShowHelp - Function to show keyboard shortcuts help
 * @param onSearch - Optional function to open search
 */

interface UseGlobalShortcutsProps {
  onShowHelp: () => void
  onSearch?: () => void
}

export const useGlobalShortcuts = ({
  onShowHelp,
  onSearch,
}: UseGlobalShortcutsProps): void => {
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // ?: Show keyboard shortcuts help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        onShowHelp()
        return
      }

      // Ctrl/Cmd + K: Search (if available)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && onSearch) {
        e.preventDefault()
        onSearch()
        return
      }
    }

    document.addEventListener('keydown', handleShortcut)
    return () => document.removeEventListener('keydown', handleShortcut)
  }, [onShowHelp, onSearch])
}
