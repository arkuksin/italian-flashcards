import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface ConfirmLeaveDialogProps {
  open: boolean
  onClose: () => void
  onConfirmSave: () => void
  onConfirmDiscard: () => void
  isSaving: boolean
  destinationLabel?: string
}

export const ConfirmLeaveDialog: React.FC<ConfirmLeaveDialogProps> = ({
  open,
  onClose,
  onConfirmSave,
  onConfirmDiscard,
  isSaving,
  destinationLabel = 'den vorherigen Bereich',
}) => {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, open])

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-leave-title"
      data-testid="confirm-leave-dialog"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 id="confirm-leave-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Fortschritt sichern?
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Dialog schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5 text-sm text-gray-600 dark:text-gray-300">
          <p>
            Du bist dabei, {destinationLabel} aufzurufen. Möchtest du den aktuellen Aufgabenfortschritt speichern, bevor du den
            Bereich verlässt?
          </p>
          <p className="rounded-lg bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
            Tipp: Gespeicherte Aufgaben kannst du jederzeit über die Modus-Auswahl fortsetzen.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-200 px-6 py-4 text-sm dark:border-gray-700 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onConfirmDiscard}
            className="inline-flex items-center justify-center rounded-full border border-transparent px-4 py-2 font-medium text-gray-600 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Ohne Speichern verlassen
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-transparent px-4 py-2 font-medium text-gray-600 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-800 sm:order-first"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onConfirmSave}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 font-semibold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-75"
            disabled={isSaving}
          >
            {isSaving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-transparent" />}
            <span>Fortschritt speichern &amp; wechseln</span>
          </button>
        </div>
      </div>
    </div>
  )
}
