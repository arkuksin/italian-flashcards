# Feature: Aufgabenmodus – Navigation zwischen Bearbeiten, Auswahl & Analyse

## Problemstellung
Im aktuellen Aufgabenmodus (z. B. während einer Übung oder Challenge) bleibt der User „gefangen“. Es fehlt eine klare, jederzeit verfügbare Navigation zurück zur Mode-Auswahl, Kategorien-Analyse oder anderen wichtigen Bereichen. Dies erzeugt Frust, insbesondere wenn man schnell den Kontext wechseln oder Ergebnisse einsehen möchte.

## Ziele
- **Seamless Navigation:** User können jederzeit ohne Verlust des Fortschritts zu Mode Selection, Kategorie-Analyse oder Dashboard zurückkehren.
- **UX Best Practices:** Konsistente, sticky Navigation mit klarer Hierarchie, eindeutigen Labels und sichtbaren Statusindikatoren.
- **Sicherheit:** Unfertige Aufgaben dürfen nicht versehentlich verworfen werden. Bestätigungsmodale, Auto-Save oder Progress-Badges informieren über den aktuellen Stand.
- **Responsivität:** Navigation funktioniert auf Desktop, Tablet und Mobile gleichermaßen.

## Designprinzipien (UX/UI)
- **Sticky Header / Dock:** Persistente Navigationsleiste oben (Desktop) bzw. Bottom Tab (Mobile) mit klaren Icons + Labels.
- **Bread Crumbs:** Zeigen, in welchem Lernmodus sich der User befindet (z. B. „Dashboard > Aufgabenmodus > Verbkonjugationen“).
- **Primary CTA:** „Zur Auswahl“ / „Analyse öffnen“ als deutlich sichtbare Buttons; sekundäre Aktionen (z. B. „Speichern & schließen“).
- **Status Indicators:** Fortschrittsring oder Pill (z. B. „3/10 gelöst“, „30% abgeschlossen“), damit User wissen, was passiert beim Kontextwechsel.
- **Confirmation Dialoge:** Beim Verlassen eines aktiven Tasks erscheint ein Modal mit Optionen: „Fortschritt speichern & zurück“, „Abbrechen“, „Ohne Speichern verlassen“ (falls erlaubt).

## Layout-Vorschlag
```
┌───────────────────────────────────────────────┐
│ Sticky Task App Bar                           │
│ ┌───────────────┐  ┌─────────────────┐        │
│ │ ← Zur Auswahl │  │ Analyse öffnen  │        │
│ └───────────────┘  └─────────────────┘        │
│                                                
│ Task Titel          Fortschritt (3/10)  Timer │
└───────────────────────────────────────────────┘
│                                               │
│  Aufgaben-Content                             │
│  …                                            │
│                                               │
└───────────────────────────────────────────────┘
```

## Technische Umsetzung
1. **Neue Komponente `TaskModeAppBar`:**
   - Props: `onBackToModes`, `onOpenAnalysis`, `progressPercent`, `resolvedCount`, `totalCount`, `isSaving`.
   - Enthält Primär-/Sekundärbuttons, Breadcrumbs, ProgressBadge, optional Timer oder Statusdot.
   - Sticky Position + Schatten, um sich vom Content abzuheben.
2. **Routing / State:**
   - Aufgabe läuft in eigenem Route-Segment (`/task/:id`). Navigation zurück führt zu `/dashboard` oder `/mode-selection`.
   - Beim Verlassen: `useConfirmNavigation` Hook (Prompt bei unsaved changes).
   - Fortschritt in Zustand (Context/Store) sichern, damit Rückkehr nahtlos ist.
3. **Mobile Breakpoints:**
   - Desktop: Top App Bar.
   - Mobile: Kombinierter App Bar + Bottom Sheet Buttons (Floating Action).
4. **Barrierefreiheit:**
   - Buttons mit `aria-label`, Fokuszustände, `role="navigation"`.
   - Tastaturkürzel (z. B. `Esc` → Zur Auswahl, `Alt+A` → Analyse).
5. **Tests:**
   - E2E: Verlassen des Tasks → Modal → Auswahl bestätigt → Taskstate gespeichert.
   - Unit: `TaskModeAppBar` rendert Buttons/Progress korrekt.

## Nächste Schritte
1. UX Mockups (Figma) für Desktop/Mobile erstellen und Review einholen.
2. `TaskModeAppBar` Komponente bauen (+ Stories in Storybook).
3. Routing & Navigationslogik implementieren (inkl. confirm dialogs).
4. QA + Usability-Test (Nutzerfeedback zum Flow einholen).
