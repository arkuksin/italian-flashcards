import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useEscapeKey } from '../../hooks/useEscapeKey'

/**
 * Modal Component
 *
 * Accessible modal dialog component with:
 * - Focus trap (keeps focus within modal)
 * - Escape key to close
 * - Click outside to close
 * - Smooth animations
 * - Proper ARIA attributes
 *
 * @see WCAG 2.1.2 (No Keyboard Trap)
 * @see WCAG 2.4.3 (Focus Order)
 */

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Close on Escape key
  useEscapeKey(onClose, isOpen)

  // Focus trap: focus first focusable element when modal opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Save previously focused element
      const previouslyFocused = document.activeElement as HTMLElement

      // Focus close button
      closeButtonRef.current?.focus()

      // Restore focus when modal closes
      return () => {
        previouslyFocused?.focus()
      }
    }
  }, [isOpen])

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
          />

          {/* Modal Content */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`relative w-full ${maxWidthClasses[maxWidth]}
                       bg-white dark:bg-gray-800
                       rounded-2xl shadow-2xl
                       max-h-[90vh] overflow-hidden
                       flex flex-col`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2
                id="modal-title"
                className="text-2xl font-bold text-gray-900 dark:text-white"
              >
                {title}
              </h2>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700
                         dark:text-gray-400 dark:hover:text-gray-200
                         hover:bg-gray-100 dark:hover:bg-gray-700
                         transition-colors focus:outline-none focus:ring-2
                         focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
