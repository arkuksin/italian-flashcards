import React, { useMemo } from 'react'
import { ArrowLeft, BarChart3, Loader2, Timer } from 'lucide-react'
import { GAP, SPACING_PATTERNS } from '../constants/spacing'

interface TaskModeAppBarProps {
  onBackToModes: () => void
  onOpenAnalysis: () => void
  progressPercent: number
  resolvedCount: number
  totalCount: number
  isSaving?: boolean
  breadcrumbs?: string[]
  timerLabel?: string
}

export const TaskModeAppBar: React.FC<TaskModeAppBarProps> = ({
  onBackToModes,
  onOpenAnalysis,
  progressPercent,
  resolvedCount,
  totalCount,
  isSaving = false,
  breadcrumbs = ['Dashboard', 'Aufgabenmodus'],
  timerLabel,
}) => {
  const clampedPercent = useMemo(() => Math.min(100, Math.max(0, Math.round(progressPercent))), [progressPercent])

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700 shadow-sm"
      role="navigation"
      data-testid="task-mode-app-bar"
    >
      <div className={`mx-auto flex w-full flex-col ${GAP.md} px-4 py-2 md:py-3 sm:flex-row sm:items-center sm:justify-between`}>
        <div className={`flex items-center ${GAP.sm}`}>
          <button
            type="button"
            onClick={onBackToModes}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-blue-400 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:bg-gray-900/80 dark:text-gray-200 dark:hover:border-blue-500"
            aria-label="Zur Auswahl"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Zur Auswahl</span>
            <span className="sm:hidden">Zurück</span>
          </button>

          {/* Mobile: Simple page title */}
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100 md:hidden">
            Aufgabenmodus
          </h1>

          {/* Desktop: Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="hidden md:block">
            <ol className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-300">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb} className="flex items-center gap-1">
                  <span>{crumb}</span>
                  {index < breadcrumbs.length - 1 && <span aria-hidden="true">/</span>}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className={`flex flex-1 flex-col ${GAP.xs} sm:flex-row sm:items-center sm:justify-end`}>
          {/* Mobile: Compact single badge */}
          <div className="flex items-center justify-between md:hidden">
            <div className={`inline-flex items-center ${SPACING_PATTERNS.iconText} rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-200`}>
              <span>{resolvedCount}/{totalCount}</span>
              <span className="text-blue-500/50 dark:text-blue-200/50">•</span>
              <span>{clampedPercent}%</span>
              {timerLabel && (
                <>
                  <span className="text-blue-500/50 dark:text-blue-200/50">•</span>
                  <Timer className="h-3 w-3" aria-hidden="true" />
                  <span>{timerLabel}</span>
                </>
              )}
            </div>

            {/* Mobile: Icon-only analysis button */}
            <button
              type="button"
              onClick={onOpenAnalysis}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Analyse öffnen"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>

          {/* Desktop: Multiple detailed badges */}
          <div className={`hidden md:flex items-center ${GAP.sm}`}>
            <div className={`flex items-center ${SPACING_PATTERNS.iconText} rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-200`}>
              <span>{resolvedCount}</span>
              <span className="text-xs text-blue-500/70 dark:text-blue-200/70">von</span>
              <span>{totalCount}</span>
            </div>
            <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              clampedPercent === 100
                ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-200'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-200'
            }`}
              data-testid="progress-badge"
            >
              {clampedPercent}% erledigt
            </div>
            {timerLabel && (
              <div className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600 dark:bg-purple-500/10 dark:text-purple-200">
                <Timer className="h-3 w-3" aria-hidden="true" />
                <span>{timerLabel}</span>
              </div>
            )}
            {isSaving && (
              <div
                className={`inline-flex items-center ${SPACING_PATTERNS.iconText} rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600 dark:bg-amber-500/10 dark:text-amber-200`}
                data-testid="saving-indicator"
                aria-live="polite"
              >
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                <span>Speichere…</span>
              </div>
            )}
          </div>

          {/* Desktop: Full button with text */}
          <button
            type="button"
            onClick={onOpenAnalysis}
            className={`hidden md:inline-flex items-center justify-center ${SPACING_PATTERNS.iconText} rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
            aria-label="Analyse öffnen"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analyse öffnen</span>
          </button>
        </div>
      </div>

      <div className="px-4 pb-2 md:pb-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700" aria-hidden="true">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${clampedPercent}%` }}
          />
        </div>
      </div>
    </header>
  )
}
