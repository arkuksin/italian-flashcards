import React from 'react'

/**
 * Keyboard Shortcuts Help Component
 *
 * Displays comprehensive keyboard shortcuts documentation for the application.
 * Organized into sections:
 * - Navigation (Tab, Escape, Skip link)
 * - Flashcard Controls (Enter, Space, difficulty ratings)
 * - Category Grid (Arrow keys, Home, End)
 * - Application Shortcuts (Ctrl+T, Ctrl+R, Ctrl+S)
 *
 * Triggered by pressing "?" key anywhere in the app.
 */

interface ShortcutItemProps {
  keys: string[]
  description: string
}

const ShortcutItem: React.FC<ShortcutItemProps> = ({ keys, description }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <div className="flex flex-wrap gap-2">
      {keys.map((key, index) => (
        <kbd
          key={index}
          className="px-3 py-1.5 text-sm font-mono font-semibold
                     bg-gray-100 dark:bg-gray-700
                     text-gray-700 dark:text-gray-300
                     border border-gray-300 dark:border-gray-600
                     rounded-lg shadow-sm"
        >
          {key}
        </kbd>
      ))}
    </div>
    <span className="text-sm text-gray-600 dark:text-gray-400 flex-1 text-right">
      {description}
    </span>
  </div>
)

interface ShortcutSectionProps {
  title: string
  shortcuts: Array<{ keys: string[]; description: string }>
}

const ShortcutSection: React.FC<ShortcutSectionProps> = ({ title, shortcuts }) => (
  <section className="mb-8 last:mb-0">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      {title}
    </h3>
    <div className="space-y-1">
      {shortcuts.map((shortcut, index) => (
        <ShortcutItem
          key={index}
          keys={shortcut.keys}
          description={shortcut.description}
        />
      ))}
    </div>
  </section>
)

export const KeyboardShortcutsHelp: React.FC = () => {

  const sections = [
    {
      title: 'Navigation',
      shortcuts: [
        { keys: ['Tab'], description: 'Move to next interactive element' },
        { keys: ['Shift', '+', 'Tab'], description: 'Move to previous interactive element' },
        { keys: ['Escape'], description: 'Close modal or dialog' },
        { keys: ['?'], description: 'Show keyboard shortcuts (this dialog)' },
      ],
    },
    {
      title: 'Flashcard Controls',
      shortcuts: [
        { keys: ['Enter'], description: 'Submit answer / Reveal answer' },
        { keys: ['Space'], description: 'Reveal answer' },
        { keys: ['1'], description: 'Rate as "Again" (incorrect)' },
        { keys: ['2'], description: 'Rate as "Hard"' },
        { keys: ['3'], description: 'Rate as "Good"' },
        { keys: ['4'], description: 'Rate as "Easy"' },
        { keys: ['←', '→'], description: 'Navigate between cards (when answer shown)' },
      ],
    },
    {
      title: 'Application Shortcuts',
      shortcuts: [
        { keys: ['Ctrl', '+', 'T'], description: 'Toggle learning direction' },
        { keys: ['Ctrl', '+', 'R'], description: 'Restart session' },
        { keys: ['Ctrl', '+', 'S'], description: 'Shuffle cards' },
        { keys: ['Ctrl', '+', 'A'], description: 'Toggle accent sensitivity' },
      ],
    },
    {
      title: 'Category Grid',
      shortcuts: [
        { keys: ['↑', '↓', '←', '→'], description: 'Navigate between categories' },
        { keys: ['Space'], description: 'Select/deselect category' },
        { keys: ['Enter'], description: 'Select/deselect category' },
        { keys: ['Home'], description: 'Go to first category' },
        { keys: ['End'], description: 'Go to last category' },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        This application supports comprehensive keyboard navigation. Use these shortcuts to
        navigate more efficiently without using a mouse.
      </p>

      {/* Shortcut Sections */}
      {sections.map((section, index) => (
        <ShortcutSection
          key={index}
          title={section.title}
          shortcuts={section.shortcuts}
        />
      ))}

      {/* Footer Note */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-500">
          <strong>Note:</strong> On Mac, use <kbd className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">⌘ Cmd</kbd> instead of <kbd className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">Ctrl</kbd>.
          Shortcuts are disabled when typing in text fields.
        </p>
      </div>
    </div>
  )
}
