import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { TaskModeAppBar } from '../TaskModeAppBar'

describe('TaskModeAppBar', () => {
  it('renders navigation controls and progress information', () => {
    const html = renderToStaticMarkup(
      <TaskModeAppBar
        onBackToModes={() => {}}
        onOpenAnalysis={() => {}}
        progressPercent={72.4}
        resolvedCount={18}
        totalCount={25}
        breadcrumbs={['Dashboard', 'Aufgabenmodus', 'Test']}
      />,
    )

    expect(html).toContain('Zur Auswahl')
    expect(html).toContain('Analyse öffnen')
    expect(html).toContain('72% erledigt')
    expect(html).toContain('18')
    expect(html).toContain('25')
    expect(html).toContain('Dashboard')
    expect(html).toContain('Aufgabenmodus')
  })

  it('shows a saving indicator when saving is in progress', () => {
    const html = renderToStaticMarkup(
      <TaskModeAppBar
        onBackToModes={() => {}}
        onOpenAnalysis={() => {}}
        progressPercent={50}
        resolvedCount={5}
        totalCount={10}
        isSaving
      />,
    )

    expect(html).toContain('Speichere')
  })
})
