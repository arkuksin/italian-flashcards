# Feature: Mode Selection UI - Buttons oben positionieren

## Übersicht
Die Auswahl-Flächen für die Lernrichtung sollen oben auf der Seite sein, nicht unten. Direkt darunter müssen die Kategorie-Flächen/Filterchips angezeigt werden, sodass Lernrichtung **und** Kategorien ohne Scroll sichtbar sind. Zusätzlich müssen die Kategorienamen immer in der UI-Sprache dargestellt werden, die der User über den Language Switcher ausgewählt hat.

## Motivation
- Wichtigste Aktionen (Lernrichtung + Kategorien) sollten "above the fold" sein
- User müssen nicht scrollen, um zu starten oder Kategorien zu filtern
- Verbessert visuelle Hierarchie
- Folgt Best Practices für Call-to-Action Platzierung
- Reduziert kognitive Last
- Konsistente Localisierung: Beschriftungen folgen der UI-Sprache

## Aktuelle Situation

```
Aktuelles Layout (Dashboard.tsx):
┌─────────────────────────────────────┐
│  Header mit Statistiken             │
│                                     │
│  Gamification Widgets               │
│  - Daily Streak                     │
│  - XP Progress                      │
│  - Achievements                     │
│  - Daily Goals                      │
│                                     │
│  Leitner Box Visualizer             │
│                                     │
│  ↓ Scrollen erforderlich ↓          │
│                                     │
│  Mode Selection                     │
│  [ 🇷🇺 → 🇮🇹 ]                      │
│  [ 🇮🇹 → 🇷🇺 ]                      │
└─────────────────────────────────────┘
```

## Verbessertes Layout

```
Neues Layout:
┌─────────────────────────────────────┐
│  Header (minimal)                   │
│                                     │
│  Mode Selection (prominent)         │
│  ┌─────────────────────────────┐  │
│  │  🌍 Lernrichtung wählen     │  │
│  │                              │  │
│  │  [ 🇷🇺 → 🇮🇹 Russisch →     │  │
│  │             Italienisch ]    │  │
│  │                              │  │
│  │  [ 🇮🇹 → 🇷🇺 Italienisch →  │  │
│  │             Russisch ]       │  │
│  └─────────────────────────────┘  │
│                                     │
│  Kategorie-Filter (lokalisiert)     │
│  [ Reisen ] [ Business ] [ Alltag ] │
│                                     │
│  Quick Stats (kompakt)              │
│                                     │
│  ↓ Weitere Widgets unten ↓          │
│                                     │
│  Gamification Widgets               │
│  Leitner Box Visualizer             │
│  etc.                               │
└─────────────────────────────────────┘
```

## Implementierung

### Datei: `src/pages/Dashboard.tsx`

**Aktueller Code (vereinfacht):**
```tsx
export default function Dashboard() {
  return (
    <div>
      <Statistics />

      {/* Gamification Widgets */}
      <div className="grid grid-cols-2 gap-4">
        <DailyStreakWidget />
        <XPProgressBar />
        <AchievementBadges />
        <DailyGoalProgress />
      </div>

      <LeitnerBoxVisualizer />

      {/* Mode Selection ganz unten */}
      {!selectedMode && <ModeSelection onModeSelect={handleModeSelect} />}
    </div>
  );
}
```

**Neuer Code:**
```tsx
export default function Dashboard() {
  const { user } = useAuth();
  const uiLanguage = useUILanguage(); // z.B. aus useLanguagePreference / i18n

  return (
    <div>
      {/* Mode Selection + Kategorien ohne Scroll */}
      <section className="space-y-6 mb-10">
        {!selectedMode && (
          <ModeSelection onModeSelect={handleModeSelect} />
        )}

        <CategoryFilter
          userId={user?.id ?? ''}
          onSelectionChange={setSelectedCategories}
          locale={uiLanguage}
        />
      </section>

      {/* Kompakte Stats */}
      <QuickStats />

      {/* Weitere Widgets unten */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        <DailyStreakWidget />
        <XPProgressBar />
        <AchievementBadges />
        <DailyGoalProgress />
      </div>

      <LeitnerBoxVisualizer />
    </div>
  );
}
```

### Änderungen in `ModeSelection.tsx`

**Verbesserte Visual Prominence:**

```tsx
// src/components/ModeSelection.tsx

export const ModeSelection: React.FC<ModeSelectionProps> = ({ onModeSelect }) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border-2 border-blue-200 shadow-lg">
      {/* Hero-ähnlicher Header */}
      <div className="text-center mb-6">
        <Globe className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Bereit zum Lernen?
        </h2>
        <p className="text-gray-600 text-lg">
          Wählen Sie Ihre Lernrichtung
        </p>
      </div>

      {/* Große, klickbare Buttons */}
      <div className="space-y-4 max-w-2xl mx-auto">
        <motion.button
          onClick={() => onModeSelect('ru-it')}
          className="w-full p-6 bg-white border-3 border-blue-300 rounded-xl hover:border-blue-500 hover:shadow-xl transition-all group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl">🇷🇺</span>
              <div className="text-left">
                <div className="text-2xl font-bold text-gray-800">
                  Russisch → Italienisch
                </div>
                <div className="text-sm text-gray-600">
                  245 Wörter · 68% Accuracy
                </div>
              </div>
            </div>
            <ChevronRight className="w-8 h-8 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </motion.button>

        <motion.button
          onClick={() => onModeSelect('it-ru')}
          className="w-full p-6 bg-white border-3 border-blue-300 rounded-xl hover:border-blue-500 hover:shadow-xl transition-all group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl">🇮🇹</span>
              <div className="text-left">
                <div className="text-2xl font-bold text-gray-800">
                  Italienisch → Russisch
                </div>
                <div className="text-sm text-gray-600">
                  245 Wörter · 72% Accuracy
                </div>
              </div>
            </div>
            <ChevronRight className="w-8 h-8 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </motion.button>
      </div>

      {/* Optional: Quick Actions */}
      <div className="mt-6 flex items-center justify-center gap-4 text-sm">
        <button className="text-blue-600 hover:text-blue-800 underline">
          Kategorien filtern
        </button>
        <span className="text-gray-400">·</span>
        <button className="text-blue-600 hover:text-blue-800 underline">
          Einstellungen
        </button>
      </div>
    </div>
  );
};
```

### Änderungen in `CategoryFilter.tsx`

- `CategoryFilter` bekommt optionales Prop `locale?: SupportedLanguage`. Fallback auf `i18n.language`, damit Serverdaten (Keys) lokalisiert ausgegeben werden.
- Texte wie Titel, Buttons "Alle/Keine", Error-/Loading-Messages landen im `dashboard`-Namespace und werden über `const { t } = useTranslation('dashboard')` gerendert.
- Die vom Backend kommenden Kategorien behalten ihre Keys (`travel`, `business`, `daily`, ...). Vor der Darstellung wird per `t('categories.' + categoryKey + '.label', categoryKey)` übersetzt.
- Die Komponente bleibt weiterhin datengetrieben (Stats, Suggestion, Save), aber alle sichtbaren Strings laufen durch die Übersetzungen, damit UI-Sprache konsequent bleibt.

### Lokalisierungsdaten erweitern

- `public/locales/*/dashboard.json` um die neuen Kategorie-Labels und Filtertexte ergänzen, z. B.:

```json
{
  "filter": {
    "title": "Kategorien filtern (optional)",
    "selected": "{{count}} ausgewählt",
    "all": "Alle",
    "none": "Keine",
    "error": "Kategorien konnten nicht geladen werden",
    "retry": "Erneut versuchen"
  },
  "categories": {
    "travel": "Reisen",
    "business": "Business",
    "daily": "Alltag",
    "food": "Essen & Trinken"
  }
}
```
- Gleiches Schema für `en`, `it`, `ru`, `de`, damit Language Switcher sofort greift.

### Neue `QuickStats` Component

```tsx
// src/components/QuickStats.tsx

export const QuickStats: React.FC = () => {
  const { progress } = useProgress();
  const { gamification } = useGamification();

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-xs text-gray-600 mb-1">Gelernt</div>
        <div className="text-2xl font-bold text-gray-800">
          {progress.wordsLearned}
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-xs text-gray-600 mb-1">Accuracy</div>
        <div className="text-2xl font-bold text-green-600">
          {progress.accuracy}%
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-xs text-gray-600 mb-1">Streak</div>
        <div className="text-2xl font-bold text-orange-600">
          {gamification.currentStreak} 🔥
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-xs text-gray-600 mb-1">Level</div>
        <div className="text-2xl font-bold text-purple-600">
          {gamification.level}
        </div>
      </div>
    </div>
  );
};
```

## Visuelle Verbesserungen

### 1. **Größere Buttons**
- Von `p-4` zu `p-6` Padding
- Text von `text-lg` zu `text-2xl`
- Flaggen von `text-2xl` zu `text-5xl`

### 2. **Stärkere visuelle Hierarchie**
- Gradient Background für Mode Selection Container
- Border und Shadow für Hervorhebung
- Hover-Effekte mit scale transformation

### 3. **Bessere Informationsdichte**
- Stats direkt bei jedem Button
- Kompakte QuickStats oben
- Detailliertere Widgets unten (optional)

### 4. **Animation**
- Framer Motion für smooth interactions
- Hover effects
- Click feedback (scale)

## User Flow Verbesserung

**Vorher:**
1. User landet auf Dashboard
2. Sieht Statistiken und Widgets
3. Scrollt nach unten
4. Findet Mode Selection
5. Wählt Richtung

**Nachher:**
1. User landet auf Dashboard
2. Sieht sofort Mode Selection prominent
3. Wählt direkt Richtung (kein Scrollen)
4. Optional: Scrollt für weitere Infos

## Mobile Optimierung

```tsx
// Responsive Design
<div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 md:p-8 border-2 border-blue-200">
  <div className="text-center mb-4 md:mb-6">
    <Globe className="w-12 h-12 md:w-16 md:h-16 text-blue-600 mx-auto mb-3 md:mb-4" />
    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
      Bereit zum Lernen?
    </h2>
  </div>

  <div className="space-y-3 md:space-y-4">
    <button className="w-full p-4 md:p-6 ...">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-3xl md:text-5xl">🇷🇺</span>
          <div>
            <div className="text-lg md:text-2xl font-bold">
              Russisch → Italienisch
            </div>
          </div>
        </div>
      </div>
    </button>
  </div>
</div>
```

## A/B Testing Metriken

Zu messende Verbesserungen:
- **Time to First Click**: Wie schnell startet User eine Session?
- **Session Start Rate**: Wie viele User starten tatsächlich?
- **Bounce Rate**: Verlassen weniger User ohne zu lernen?
- **User Satisfaction**: Feedback-Umfrage

## User Stories

1. **Als neuer User** möchte ich sofort sehen, was ich tun kann, ohne zu scrollen.

2. **Als wiederkehrender User** möchte ich schnell starten können, ohne Ablenkung.

3. **Als Mobile User** möchte ich die wichtigste Aktion thumb-friendly haben.

## Akzeptanzkriterien

- [ ] Mode Selection ist das erste sichtbare interaktive Element
- [ ] Kein Scrollen erforderlich um Buttons zu sehen
- [ ] Buttons sind größer und auffälliger
- [ ] Stats sind kompakt aber sichtbar
- [ ] Responsive Design funktioniert auf Mobile
- [ ] Smooth Animationen bei Hover/Click
- [ ] Widgets sind weiterhin zugänglich (unten)
- [ ] Performance ist nicht beeinträchtigt

## Priorität
**Hoch** ⭐⭐⭐

## Aufwand
- **Dashboard Layout Anpassung**: 2 Stunden
- **ModeSelection Component Update**: 3 Stunden
- **QuickStats Component**: 2 Stunden
- **Responsive Testing**: 2 Stunden
- **A/B Testing Setup**: 3 Stunden
- **Gesamt**: 1-2 Tage

## Abhängigkeiten
- Keine kritischen Abhängigkeiten
- Optional: A/B Testing Framework (z.B. PostHog, Optimizely)

## Risiken
- Minimales Risiko
- Kann einfach zurückgerollt werden
- User könnten Änderung bemerken (Change Management)

## Implementation Plan

### Phase 1: Component Updates (2 Stunden)
1. QuickStats Component erstellen
2. ModeSelection visuell verbessern
3. Animationen hinzufügen

### Phase 2: Layout Reorganisation (2 Stunden)
1. Dashboard.tsx umstrukturieren
2. Responsive Breakpoints testen
3. Mobile optimieren

### Phase 3: Testing (2 Stunden)
1. Unit Tests updaten
2. E2E Tests anpassen
3. Visual Regression Tests

### Phase 4: Deployment (2 Stunden)
1. Staged Rollout (10% → 50% → 100%)
2. Monitoring
3. User Feedback sammeln

## Success Metrics

**Ziele nach 1 Woche:**
- ↑ 20% schnellere Time to First Click
- ↑ 15% höhere Session Start Rate
- ↓ 10% niedrigere Bounce Rate
- ≥ 4.5/5 User Satisfaction Score

## Nächste Schritte
1. Design-Review mit Team
2. Prototype erstellen
3. User-Testing mit 5 Personen
4. Implementation
5. A/B Test Setup
6. Staged Rollout
7. Monitoring und Iteration
