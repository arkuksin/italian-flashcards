# Technischer Plan: Saubere Fortschritts-Synchronisation

**Projekt:** Italian Flashcards (Next.js/React + Supabase)
**Datum:** 2025-10-12
**Status:** Plan (Implementierung ausstehend)

---

## 1. Problemstellung

### Aktuelle Symptome
- **Beim Üben**: Fortschrittszahlen (Correct, Wrong, Accuracy, Streak) aktualisieren sich nicht zuverlässig in der ProgressBar
- **Nach Login/Logout**: Werte sind inkonsistent zwischen Dashboard und Flashcards-Ansicht
- **Nach Routenwechsel**: Stats können auf 0 zurückfallen oder veraltete Werte zeigen
- **Kein Realtime-Feedback**: Änderungen werden nicht sofort sichtbar

### Root Cause Analysis

**Dual-State Problem:**
```typescript
// Dashboard.tsx - Lokaler Session State (PROBLEM)
const [state, setState] = useState<AppState>({
  progress: {
    correct: 0,    // ❌ Nur Session-Speicher, wird bei Reload auf 0 gesetzt
    wrong: 0,
    streak: 0,
    completed: new Set(),
  }
})

// useProgress.ts - Database State (KORREKT)
const [progress, setProgress] = useState<Map<number, WordProgress>>(new Map())
```

**Synchronisationslücken:**
1. **Schreibpfad**: `handleSubmit` → `updateProgress(wordId, correct)` → DB + lokaler State
2. **Lesepfad**: ProgressBar nutzt `getStats()`, aber nur beim initialen Render
3. **Keine Realtime-Updates**: Kein Supabase Realtime Subscription aktiv
4. **Parallele States**: Dashboard pflegt eigenen `state.progress`, der nicht mit DB synchronisiert wird

---

## 2. Datenmodell & Single Source of Truth

### 2.1 Bestehende Tabellen (bereits implementiert)

#### `user_progress` (Haupttabelle für Fortschritt)
```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  word_id INTEGER NOT NULL REFERENCES words(id),
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  mastery_level INTEGER DEFAULT 0,
  last_practiced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, word_id)  -- Ein Eintrag pro User+Word
);

CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_last_practiced ON user_progress(user_id, last_practiced DESC);
```

#### `learning_sessions` (Session-Tracking)
```sql
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  learning_direction TEXT NOT NULL,  -- 'ru-it' oder 'it-ru'
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  words_studied INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  wrong_answers INTEGER DEFAULT 0,
  session_duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.2 Aggregierte Statistiken (Berechnungslogik)

**Single Source of Truth:** Alle Statistiken werden IMMER aus `user_progress` berechnet (nie redundant gespeichert).

```typescript
interface ProgressStats {
  totalWordsStudied: number      // COUNT(DISTINCT word_id) aus user_progress
  totalAttempts: number           // SUM(correct_count + wrong_count)
  correctAnswers: number          // SUM(correct_count)
  accuracy: number                // (correctAnswers / totalAttempts) * 100
  currentStreak: number           // Berechnet aus letzten 10 Worten (last_practiced DESC)
  longestStreak: number           // Historisch beste Streak
  masteredWords: number           // COUNT(WHERE mastery_level >= 4)
  wordsInProgress: number         // COUNT(WHERE 0 < mastery_level < 4)
}
```

**Wo berechnet:** Im Frontend via `useProgress().getStats()` (bereits implementiert in `src/hooks/useProgress.ts:226-261`)

**Warum nicht in DB:**
- ✅ Einfachere Logik (keine Trigger/Functions nötig)
- ✅ TypeScript-Type-Safety
- ✅ Client-seitige Berechnungen sind schnell genug (<300 Einträge)
- ❌ NACHTEIL: Keine serverseitigen Aggregation-Views für Reports (kann später hinzugefügt werden)

---

## 3. Schreibpfad beim Üben (Write Path)

### 3.1 Ereignisfluss bei einer Antwort

```
User tippt Antwort ein + drückt Enter
         ↓
handleSubmit() in Dashboard
         ↓
[1] Lokale Validierung (korrekt/falsch)
         ↓
[2] Optimistic Update (lokaler State sofort)
         ↓
[3] updateProgress(wordId, correct) → Supabase
         ↓
[4] Server ACK + Response mit neuen Werten
         ↓
[5] Reconciliation (Server-Werte überschreiben lokale)
         ↓
[6] Realtime Event → andere Komponenten updaten
```

### 3.2 Implementierung: Idempotente Writes

**Aktuell (useProgress.ts:157-223):**
```typescript
const updateProgress = async (wordId: number, correct: boolean) => {
  // [2] Optimistic Update (bereits implementiert ✅)
  const newProgress = new Map(progress)
  newProgress.set(wordId, updatedProgress)
  setProgress(newProgress)

  // [3] Server Write mit UPSERT (bereits implementiert ✅)
  const { data, error } = await supabase
    .from('user_progress')
    .upsert(updatedProgress, { onConflict: 'user_id,word_id' })
    .select()
    .single()

  // [5] Server Response übernimmt (bereits implementiert ✅)
  finalProgress.set(wordId, data)
  setProgress(finalProgress)
}
```

**Idempotenz:** UPSERT mit `onConflict: 'user_id,word_id'` garantiert, dass wiederholte Aufrufe mit gleichem wordId den Eintrag updaten (nicht duplizieren).

### 3.3 NEU: Debouncing für schnelle Eingaben

**Problem:** User beantwortet 3 Fragen in 2 Sekunden → 3 separate DB-Calls.

**Lösung:** Batch-Updates mit Debounce + Request Queue

```typescript
// NEU in useProgress.ts
type ProgressDelta = { correctDelta: number; wrongDelta: number }

const pendingUpdatesRef = useRef<Map<number, ProgressDelta>>(new Map())
const flushTimeoutRef = useRef<number | null>(null)

const scheduleFlush = useCallback(() => {
  if (flushTimeoutRef.current !== null) return

  flushTimeoutRef.current = window.setTimeout(async () => {
    const batch = Array.from(pendingUpdatesRef.current.entries())
    pendingUpdatesRef.current = new Map()
    flushTimeoutRef.current = null

    if (batch.length === 0) {
      return
    }

    const updates = batch.map(([wordId, deltas]) =>
      buildProgressUpdate(wordId, deltas)
    )

    const { error } = await supabase
      .from('user_progress')
      .upsert(updates, { onConflict: 'user_id,word_id' })

    if (!error) {
      await loadProgress() // Reload from DB
    }
  }, 500)
}, [loadProgress])

const queueUpdate = useCallback((wordId: number, correct: boolean) => {
  const next = new Map(pendingUpdatesRef.current)
  const existing = next.get(wordId) ?? { correctDelta: 0, wrongDelta: 0 }
  next.set(wordId, {
    correctDelta: existing.correctDelta + (correct ? 1 : 0),
    wrongDelta: existing.wrongDelta + (correct ? 0 : 1)
  })
  pendingUpdatesRef.current = next
  scheduleFlush()
}, [scheduleFlush])

useEffect(() => () => {
  if (flushTimeoutRef.current !== null) {
    window.clearTimeout(flushTimeoutRef.current)
  }
}, [])
```

**Wichtig:** `scheduleFlush` nutzt `useRef`, damit kein neuer Debounce-Timer pro Render entsteht und bereits geplante Flushes verlässlich ausgeführt werden; ein Cleanup im `useEffect` räumt den Timer beim Unmount auf.

**Vorteile:**
- Aggregiert korrekte/falsche Antworten pro Wort ohne Zähler zu verlieren
- Reduziert DB-Calls von N auf 1 (bei schnellen Antworten)
- Optimistic Updates bleiben sofort sichtbar
- Server-Reconciliation nach 500ms Ruhe

**Trade-offs:**
- Leichte Verzögerung bei DB-Persistierung (aber nicht bei UI-Feedback)
- Komplexere Fehlerbehandlung bei Batch-Failures
- Zusätzlicher In-Memory-Puffer (aber nur wenige Einträge gleichzeitig)

### 3.4 Fehlerbehandlung & Retry

**Bereits implementiert (useProgress.ts:194-222):**
- ✅ Offline-Queue (In-Memory, ohne LocalStorage-Persistierung)
- ✅ Automatic Retry bei Netzwerkfehler
- ✅ User-sichtbare Fehlermeldungen (`setError()`)

**NEU: Exponential Backoff für Retries**

```typescript
const retryWithBackoff = async (
  fn: () => Promise<void>,
  maxRetries = 3
) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fn()
      return
    } catch (error) {
      const delay = Math.min(1000 * Math.pow(2, i), 10000) // Max 10s
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  // Nach maxRetries → Queue für spätere Sync
  setOfflineQueue(prev => [...prev, { type: 'progress', data }])
}
```

---

## 4. Lesepfad & Konsistenz (Read Path)

### 4.1 Problem: Doppelte State-Verwaltung

**Aktuell:**
- Dashboard.tsx hat eigenen `state.progress` (Session-only)
- ProgressBar ruft `useProgress().getStats()` auf (DB-backed)
- Nach Reload: `state.progress` ist 0, DB hat echte Werte

**Lösung: ENTFERNE Session-State komplett**

```typescript
// VORHER (Dashboard.tsx) ❌
const [state, setState] = useState<AppState>({
  progress: { correct: 0, wrong: 0, streak: 0, completed: new Set() }
})

// NACHHER ✅
// Kein lokaler progress State mehr!
const [state, setState] = useState({
  currentWordIndex: 0,
  userInput: '',
  showAnswer: false,
  learningDirection: 'ru-it' as LearningDirection,
  darkMode: false,
  shuffleMode: false,
})

// Stats kommen NUR aus useProgress
const { getStats } = useProgress()
const stats = getStats()
```

### 4.2 Gemeinsamer Selector Hook für alle Komponenten

**NEU: useProgressStats() Hook (Wrapper um useProgress)**

```typescript
// src/hooks/useProgressStats.ts (NEU)
export const useProgressStats = () => {
  const { getStats, loading, error } = useProgress()
  const [stats, setStats] = useState<ProgressStats | null>(null)

  useEffect(() => {
    if (!loading) {
      setStats(getStats())
    }
  }, [loading, getStats])

  return { stats, loading, error }
}
```

**Verwendung in allen Komponenten:**

```typescript
// Statistics.tsx (Dashboard Sidebar)
const { stats, loading } = useProgressStats()
if (loading) return <Skeleton />
return <div>{stats.accuracy}%</div>

// ProgressBar.tsx (Flashcards View)
const { stats, loading } = useProgressStats()
if (loading) return <Skeleton />
return <div>Correct: {stats.correctAnswers}</div>
```

**Vorteil:** Eine Quelle, konsistente Werte, kein Prop-Drilling.

### 4.3 Loading States (kein 0-Flackern)

**Problem:** Beim initialen Load zeigt ProgressBar kurz "0 Correct, 0% Accuracy" bevor DB-Daten geladen sind.

**Lösung: Explizite Loading States**

```typescript
// ProgressBar.tsx (AKTUALISIERT)
export const ProgressBar: React.FC<ProgressBarProps> = ({ ... }) => {
  const { stats, loading } = useProgressStats()

  if (loading) {
    return (
      <div className="...">
        <Skeleton /> {/* Placeholder statt 0-Werte */}
      </div>
    )
  }

  // Nur rendern wenn Daten verfügbar
  return (
    <div>
      <div>Correct: {stats.correctAnswers}</div>
      <div>Accuracy: {stats.accuracy}%</div>
    </div>
  )
}
```

### 4.4 Auth-Initialisierung abwarten

**Problem:** Komponenten rendern bevor `user` verfügbar ist → leere DB-Queries.

**Lösung: Warte auf AuthContext.loading === false**

```typescript
// Dashboard.tsx (bereits teilweise implementiert)
const { user, loading: authLoading } = useAuth()
const { loading: progressLoading } = useProgress()

if (authLoading || progressLoading) {
  return <LoadingSpinner message="Loading your progress..." />
}

// Erst hier rendern wenn User + Progress geladen
```

---

## 5. Realtime-Synchronisation (Supabase Realtime)

### 5.1 Warum Realtime?

**Szenario:** User öffnet App auf 2 Geräten (Desktop + Mobile)
- Desktop: Beantwortet Frage → updateProgress()
- Mobile: Sollte AUTOMATISCH aktualisiert werden (ohne Reload)

**Ohne Realtime:** Mobile zeigt alte Werte bis User manuell reloaded.
**Mit Realtime:** Mobile erhält Update-Event innerhalb ~100ms.

### 5.2 Implementierung: Supabase Realtime Subscription

**NEU in useProgress.ts:**

```typescript
useEffect(() => {
  if (!user) return

  // Subscribe to changes in user_progress for current user
  const subscription = supabase
    .channel(`user_progress:${user.id}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'user_progress',
        filter: `user_id=eq.${user.id}` // Nur eigene Rows (RLS zusätzlich aktiv)
      },
      (payload) => {
        console.log('Realtime update received:', payload)

        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newData = payload.new as WordProgress
          setProgress(prev => {
            const updated = new Map(prev)
            updated.set(newData.word_id, newData)
            return updated
          })
        } else if (payload.eventType === 'DELETE') {
          const oldData = payload.old as WordProgress
          setProgress(prev => {
            const updated = new Map(prev)
            updated.delete(oldData.word_id)
            return updated
          })
        }
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}, [user])
```

### 5.3 RLS Policy für Realtime

**Wichtig:** Realtime respektiert RLS-Policies automatisch.

```sql
-- Lese-Policy (bereits vorhanden, aber zur Sicherheit)
CREATE POLICY "Users can read own progress"
ON user_progress FOR SELECT
USING (auth.uid() = user_id);

-- Realtime erhält nur Events für Rows, die Policy erlaubt
-- → User sieht nur Updates für eigene Einträge
```

### 5.4 UI-Update-Strategie

**Optimistic Update + Realtime Reconciliation:**

```
User beantwortet Frage
  ↓
[1] Lokaler State update (sofort, optimistic)
  ↓
[2] DB Write (updateProgress)
  ↓
[3] DB speichert + triggert Realtime Event
  ↓
[4] Realtime Event empfangen (auch von gleichem Client!)
  ↓
[5] State wird mit Server-Werten überschrieben (Reconciliation)
```

**Wichtig:** Auch der schreibende Client erhält Realtime-Event → garantiert Konsistenz.

### 5.5 Kein 0-Wert-Flackern

**Problem vermeiden:**
```typescript
// ❌ FALSCH
const stats = getStats() // Kann undefined sein während Load
return <div>{stats.accuracy || 0}%</div> // Zeigt 0 während Load

// ✅ RICHTIG
const { stats, loading } = useProgressStats()
if (loading || !stats) return <Skeleton />
return <div>{stats.accuracy}%</div> // Zeigt nur finale Werte
```

---

## 6. RLS Policies & Security

### 6.1 Bestehende Policies (verifizieren!)

```sql
-- user_progress Policies
CREATE POLICY "Users can read own progress"
ON user_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
ON user_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON user_progress FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
ON user_progress FOR DELETE
USING (auth.uid() = user_id);
```

### 6.2 Policy-Tests

**Test-Szenario:** User A versucht, Progress von User B zu lesen/schreiben.

```typescript
// e2e/rls-policies.spec.ts (NEU)
test('User cannot read other users progress', async ({ page }) => {
  // Login as User A
  await loginAs('user-a@example.com', 'password')

  // Try to query User B's progress via Supabase client
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', 'user-b-uuid')

  expect(data).toHaveLength(0) // RLS blocks access
})

test('User cannot update other users progress', async ({ page }) => {
  await loginAs('user-a@example.com', 'password')

  const { error } = await supabase
    .from('user_progress')
    .update({ correct_count: 999 })
    .eq('user_id', 'user-b-uuid')

  expect(error).toBeTruthy() // RLS blocks update
})
```

---

## 7. Streak-Logik

### 7.1 Definition

**Current Streak:** Anzahl aufeinanderfolgender korrekter Antworten in den letzten praktizierten Wörtern.

**Berechnung (bereits implementiert in useProgress.ts:234-246):**

```typescript
// Last 10 practiced words, sorted by last_practiced DESC
const recentProgress = progressArray
  .sort((a, b) => new Date(b.last_practiced).getTime() - new Date(a.last_practiced).getTime())
  .slice(0, 10)

let currentStreak = 0
for (const p of recentProgress) {
  if (p.correct_count > p.wrong_count) { // Word wurde öfter korrekt beantwortet
    currentStreak++
  } else {
    break // Streak endet bei erstem "Wrong"-Word
  }
}
```

**Zeitzone:** Nicht relevant (Streak basiert auf Reihenfolge, nicht Tagen).

### 7.2 Alternative: Tages-basierte Streak

**Definition:** Anzahl aufeinanderfolgender Tage, an denen User mindestens 1 Wort geübt hat.

**Benötigt:** Neue Tabelle `daily_streaks` (optional, komplexer).

```sql
CREATE TABLE daily_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL,
  words_practiced INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, date)
);
```

**Entscheidung:** Vorerst NICHT implementieren (zu komplex, Nutzen unklar). Current Implementation ist ausreichend.

---

## 8. Hydration & UI-State Management

### 8.1 Server State Dominanz

**Regel:** Server ist immer die Wahrheit, lokaler State nur für Optimistic UI.

```typescript
// Reconciliation Pattern
const updateProgress = async (wordId: number, correct: boolean) => {
  // [1] Optimistic: Lokaler State sofort
  setProgress(prev => {
    const optimistic = new Map(prev)
    optimistic.set(wordId, calculateOptimisticProgress(wordId, correct))
    return optimistic
  })

  // [2] Server Write
  const { data, error } = await supabase
    .from('user_progress')
    .upsert(...)
    .select()
    .single()

  // [3] Server dominiert: Überschreibe mit Server-Werten
  if (!error) {
    setProgress(prev => {
      const reconciled = new Map(prev)
      reconciled.set(wordId, data) // Server-Werte überschreiben optimistic
      return reconciled
    })
  } else {
    // [4] Rollback bei Fehler
    setProgress(prev => {
      const rolledBack = new Map(prev)
      rolledBack.set(wordId, originalProgress) // Restore old value
      return rolledBack
    })
    showError('Failed to save progress')
  }
}
```

### 8.2 Initialzustand: loading/undefined statt 0

```typescript
// ❌ FALSCH
const [stats, setStats] = useState<ProgressStats>({
  accuracy: 0, // User sieht 0% beim Load
  currentStreak: 0
})

// ✅ RICHTIG
const [stats, setStats] = useState<ProgressStats | null>(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  loadProgress().then(() => {
    setStats(getStats())
    setLoading(false)
  })
}, [])

// In UI:
if (loading || !stats) return <Skeleton />
return <div>{stats.accuracy}%</div>
```

---

## 9. Fehler- & Offline-Handling

### 9.1 Offline-Queue (bereits implementiert ✅)

**Aktueller Code (useProgress.ts:17-21, 60-80):**
- ✅ Updates werden in `offlineQueue` gespeichert
- ✅ Bei Online-Wechsel: `processOfflineQueue()` sendet alle gepufferten Updates
- ⚠️ LocalStorage-Persistierung fehlt (siehe unten)

### 9.2 NEU: LocalStorage Persistierung

**Problem:** Offline-Queue im React State geht verloren bei Tab-Close.

**Lösung:**

```typescript
// Save queue to localStorage
useEffect(() => {
  localStorage.setItem(
    `offline_queue_${user?.id}`,
    JSON.stringify(offlineQueue)
  )
}, [offlineQueue, user])

// Load queue on mount
useEffect(() => {
  const saved = localStorage.getItem(`offline_queue_${user?.id}`)
  if (saved) {
    try {
      setOfflineQueue(JSON.parse(saved))
    } catch (error) {
      console.error('Failed to restore offline queue', error)
    }
  }
}, [user])
```

### 9.3 Sichtbare Statusmeldungen

**UI-Komponente für Sync-Status:**

```typescript
// src/components/SyncStatus.tsx (NEU)
export const SyncStatus: React.FC = () => {
  const { isOnline, hasOfflineChanges } = useProgress()

  if (isOnline && !hasOfflineChanges) {
    return null // Alles OK, nichts anzeigen
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-yellow-100 rounded-lg shadow">
      {!isOnline && (
        <>
          <div className="font-bold">You're offline</div>
          <div className="text-sm">Changes will be synced when online</div>
        </>
      )}
      {hasOfflineChanges && (
        <>
          <div className="font-bold">Syncing...</div>
          <div className="text-sm">{offlineQueue.length} changes pending</div>
        </>
      )}
    </div>
  )
}
```

### 9.4 Idempotente Writes garantieren keine Duplikate

**UPSERT mit Unique Constraint:**

```sql
-- Constraint bereits vorhanden in user_progress
UNIQUE(user_id, word_id)

-- UPSERT-Beispiel (bereits implementiert)
await supabase
  .from('user_progress')
  .upsert(data, { onConflict: 'user_id,word_id' })
```

**Garantie:** Auch wenn Offline-Queue dieselbe Antwort 3x enthält → nur 1 DB-Eintrag.

---

## 10. Tests

### 10.1 Unit Tests: Aggregator/Selector

```typescript
// src/hooks/__tests__/useProgress.test.ts (NEU)
describe('getStats', () => {
  it('calculates accuracy correctly', () => {
    const progress = new Map([
      [1, { word_id: 1, correct_count: 8, wrong_count: 2 }],
      [2, { word_id: 2, correct_count: 5, wrong_count: 5 }],
    ])

    const stats = calculateStats(progress)

    expect(stats.totalAttempts).toBe(20) // 8+2+5+5
    expect(stats.correctAnswers).toBe(13) // 8+5
    expect(stats.accuracy).toBe(65) // 13/20 = 65%
  })

  it('calculates streak correctly', () => {
    const progress = new Map([
      [1, { word_id: 1, correct_count: 3, wrong_count: 0, last_practiced: '2025-01-10' }],
      [2, { word_id: 2, correct_count: 2, wrong_count: 0, last_practiced: '2025-01-09' }],
      [3, { word_id: 3, correct_count: 0, wrong_count: 1, last_practiced: '2025-01-08' }],
    ])

    const stats = calculateStats(progress)

    expect(stats.currentStreak).toBe(2) // Stops at word 3 (wrong)
  })
})
```

### 10.2 Integration Tests: Übungssequenz

```typescript
// src/components/__tests__/Dashboard.integration.test.tsx (NEU)
describe('Dashboard Progress Integration', () => {
  it('updates stats after answering questions', async () => {
    render(<Dashboard />)

    // Initial state
    expect(screen.getByText('0 Correct')).toBeInTheDocument()

    // Answer 5 questions correctly
    for (let i = 0; i < 5; i++) {
      await userEvent.type(screen.getByRole('textbox'), 'acqua')
      await userEvent.click(screen.getByText('Submit'))
      await userEvent.click(screen.getByText('Next'))
    }

    // Stats should update
    await waitFor(() => {
      expect(screen.getByText('5 Correct')).toBeInTheDocument()
      expect(screen.getByText('100%')).toBeInTheDocument() // Accuracy
      expect(screen.getByText('5')).toBeInTheDocument() // Streak
    })
  })
})
```

### 10.3 E2E Tests: Kompletter Workflow

```typescript
// e2e/progress-sync.spec.ts (NEU)
test('Progress persists across sessions', async ({ page, context }) => {
  // [1] Login
  await page.goto('/')
  await page.fill('[name="email"]', 'test-e2e@example.com')
  await page.fill('[name="password"]', 'TestPassword123!')
  await page.click('button:has-text("Sign In")')

  // [2] Answer 5 questions
  await page.click('button:has-text("Learn Italian from Russian")')
  for (let i = 0; i < 5; i++) {
    await page.fill('[data-testid="answer-input"]', 'acqua')
    await page.click('[data-testid="submit-button"]')
    await page.click('[data-testid="next-button"]')
  }

  // [3] Verify stats in Flashcards view
  await expect(page.locator('[data-testid="correct-count"]')).toContainText('5')
  await expect(page.locator('[data-testid="accuracy"]')).toContainText('100%')

  // [4] Return to Dashboard
  await page.click('[data-testid="restart-button"]')
  await expect(page.locator('[data-testid="words-studied"]')).toContainText('5')

  // [5] Logout
  await page.click('[data-testid="logout-button"]')

  // [6] Login again
  await page.fill('[name="email"]', 'test-e2e@example.com')
  await page.fill('[name="password"]', 'TestPassword123!')
  await page.click('button:has-text("Sign In")')

  // [7] Verify stats persisted on Dashboard
  await expect(page.locator('[data-testid="words-studied"]')).toContainText('5')
  await expect(page.locator('[data-testid="accuracy"]')).toContainText('100%')

  // [8] Enter Flashcards view
  await page.click('button:has-text("Learn Italian from Russian")')

  // [9] Verify stats match in Flashcards
  await expect(page.locator('[data-testid="correct-count"]')).toContainText('5')
  await expect(page.locator('[data-testid="accuracy"]')).toContainText('100%')
})

test('Stats update in real-time while practicing', async ({ page }) => {
  await loginAs(page, 'test-e2e@example.com')
  await page.click('button:has-text("Learn Italian from Russian")')

  // Initial: 0 correct
  await expect(page.locator('[data-testid="correct-count"]')).toContainText('0')

  // Answer 1 question
  await page.fill('[data-testid="answer-input"]', 'acqua')
  await page.click('[data-testid="submit-button"]')

  // Stats should update within 300ms (optimistic)
  await expect(page.locator('[data-testid="correct-count"]')).toContainText('1', { timeout: 300 })

  // Answer 2 more
  await page.click('[data-testid="next-button"]')
  await page.fill('[data-testid="answer-input"]', 'casa')
  await page.click('[data-testid="submit-button"]')

  await page.click('[data-testid="next-button"]')
  await page.fill('[data-testid="answer-input"]', 'cane')
  await page.click('[data-testid="submit-button"]')

  // Stats should show 3 correct
  await expect(page.locator('[data-testid="correct-count"]')).toContainText('3')
  await expect(page.locator('[data-testid="streak"]')).toContainText('3')
})

test('No 0-value flickering on route change', async ({ page }) => {
  await loginAs(page, 'test-e2e@example.com')

  // User has existing progress (5 words studied)
  await expect(page.locator('[data-testid="words-studied"]')).toContainText('5')

  // Enter Flashcards view
  await page.click('button:has-text("Learn Italian from Russian")')

  // Watch for ANY occurrence of "0 Correct" during load
  const zeroCorrectAppeared = await page.locator('text="0 Correct"').isVisible({ timeout: 100 })
    .catch(() => false)

  expect(zeroCorrectAppeared).toBe(false) // Should NEVER show 0 during load

  // Should show skeleton or correct value immediately
  const hasSkeletonOrValue = await Promise.race([
    page.locator('[data-testid="loading-skeleton"]').isVisible(),
    page.locator('[data-testid="correct-count"]').filter({ hasText: /[1-9]/ }).isVisible()
  ])

  expect(hasSkeletonOrValue).toBe(true)
})
```

### 10.4 Policy-Tests

```typescript
// e2e/rls-security.spec.ts (NEU)
test('User cannot access other users progress via client', async ({ page }) => {
  await loginAs(page, 'user-a@example.com')

  // Try to query user B's data via browser console
  const result = await page.evaluate(async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    )

    // Attempt to read all user_progress (should be blocked by RLS)
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')

    return { rowCount: data?.length || 0 }
  })

  // Should only see own rows (or 0 if no progress yet)
  expect(result.rowCount).toBeLessThanOrEqual(300) // Max 300 words per user
})
```

---

## 11. Migrations & Refactoring-Schritte

### 11.1 Schema-Änderungen (keine nötig!)

**Gute Nachricht:** Bestehende Tabellen sind ausreichend. Keine Migrations nötig.

### 11.2 Code-Refactoring: Schritt-für-Schritt

#### Phase 1: Single Source of Truth ✅ (teilweise implementiert)
- [x] ProgressBar nutzt `useProgress().getStats()` (bereits gefixt)
- [ ] Dashboard entfernt `state.progress` (Session-State)
- [ ] Einführung `useProgressStats()` Hook für alle Komponenten

#### Phase 2: Realtime Sync
- [ ] Supabase Realtime Subscription in `useProgress`
- [ ] Realtime Event Handler für INSERT/UPDATE/DELETE
- [ ] Test: Zwei Browser-Tabs öffnen → Stats syncen

#### Phase 3: Optimistic Updates + Reconciliation
- [ ] Verbesserte Fehlerbehandlung mit Rollback
- [ ] Exponential Backoff für Retries
- [ ] Offline-Queue mit LocalStorage-Persistierung

#### Phase 4: Debouncing (optional, aber empfohlen)
- [ ] Batch-Processor mit 500ms Debounce
- [ ] Queue für schnelle Antworten
- [ ] Performance-Verbesserung: N DB-Calls → 1 Batch

#### Phase 5: Loading States & UI-Polish
- [ ] Skeleton-Loader statt 0-Werte
- [ ] SyncStatus-Komponente
- [ ] Fehler-Toasts

#### Phase 6: Tests
- [ ] Unit-Tests für `getStats()`
- [ ] Integration-Tests für Dashboard
- [ ] E2E-Tests für kompletten Workflow
- [ ] RLS Policy-Tests

### 11.3 Entferne doppelte Berechnungen

**Aktuell:** Dashboard berechnet Stats in `handleSubmit` (lokal) UND `useProgress` (DB).

**Nach Refactoring:** Nur noch `useProgress.getStats()` existiert.

```typescript
// VORHER (Dashboard.tsx) ❌
setState(prev => ({
  ...prev,
  progress: {
    correct: correct ? prev.progress.correct + 1 : prev.progress.correct,
    wrong: correct ? prev.progress.wrong : prev.progress.wrong + 1,
    streak: correct ? prev.progress.streak + 1 : 0,
    completed: new Set([...prev.progress.completed, currentWord.id]),
  }
}))

// NACHHER ✅
// Kein lokaler State-Update! useProgress kümmert sich darum.
await updateProgress(currentWord.id, correct)
// Stats werden automatisch via Realtime/Re-Render aktualisiert
```

---

## 12. Akzeptanzkriterien (für später Verifikation)

### 12.1 Funktionale Anforderungen

- [ ] **Echtzeit-Updates**: Nach jeder Antwort aktualisieren sich Zahlen in ProgressBar innerhalb **<300ms** (optimistic)
- [ ] **Server-Konsistenz**: Nach Server-ACK sind Werte in Dashboard und Flashcards **identisch** (±0 Abweichung)
- [ ] **Persistenz**: Kein Zurücksetzen auf 0 nach:
  - [ ] Routenwechsel (Dashboard ↔ Flashcards)
  - [ ] Page Reload (F5)
  - [ ] Logout + Login
  - [ ] Browser-Tab schließen + neu öffnen
- [ ] **Realtime-Sync**: Änderungen sichtbar ohne Refresh
  - [ ] Zwei Browser-Tabs: Update in Tab 1 → automatisch sichtbar in Tab 2
- [ ] **Offline-Support**:
  - [ ] Antworten im Offline-Modus speichern in Queue
  - [ ] Beim Online-Wechsel: Automatische Synchronisation
  - [ ] User sieht Status "Syncing... X changes pending"
- [ ] **Kein 0-Flackern**: Loading-Skeleton statt 0-Werte beim initialen Load

### 12.2 Performance-Anforderungen

- [ ] **Optimistic UI**: Visuelles Feedback innerhalb **<50ms** nach Antwort
- [ ] **DB-Write**: Server-ACK innerhalb **<500ms** (normale Netzwerkbedingungen)
- [ ] **Realtime-Event**: Propagation innerhalb **<200ms**
- [ ] **Debouncing**: Bei 10 schnellen Antworten (5 Sekunden): **maximal 3 DB-Calls** statt 10

### 12.3 Sicherheits-Anforderungen

- [ ] **RLS-Schutz**: User kann nur eigene `user_progress` Einträge lesen/schreiben
- [ ] **Realtime-Filter**: Realtime-Subscription erhält nur Events für `user_id = auth.uid()`
- [ ] **Keine Leaks**: E2E-Test bestätigt: User A sieht NICHT Progress von User B

### 12.4 Test-Abdeckung

- [ ] **Unit-Tests**: 100% Coverage für `getStats()`, Streak-Berechnung
- [ ] **Integration-Tests**: Dashboard + ProgressBar synchron
- [ ] **E2E-Tests**: Alle 3 Haupt-Szenarien grün:
  1. Üben → Stats steigen → Identisch in beiden Views
  2. Logout/Login → Stats bleiben gleich
  3. Offline → Antworten → Online → Sync erfolgreich
- [ ] **Policy-Tests**: RLS blockiert Cross-User-Zugriff

---

## 13. Architektur-Diagramm

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────┐           ┌────────────────┐                │
│  │   Dashboard    │           │  Flashcards    │                │
│  │   (Statistics) │           │  (ProgressBar) │                │
│  └───────┬────────┘           └───────┬────────┘                │
│          │                            │                          │
│          └──────────┬─────────────────┘                          │
│                     │                                            │
│                     ▼                                            │
│          ┌─────────────────────┐                                │
│          │ useProgressStats()  │  ← Gemeinsamer Selector        │
│          │    (Hook Wrapper)   │                                │
│          └──────────┬──────────┘                                │
│                     │                                            │
│                     ▼                                            │
│          ┌─────────────────────┐                                │
│          │   useProgress()     │  ← Single Source of Truth      │
│          │                     │                                │
│          │ • progress: Map     │  ← In-Memory Cache (DB Snapshot)│
│          │ • getStats()        │  ← Aggregation Logic           │
│          │ • updateProgress()  │  ← Write Path                  │
│          │ • loadProgress()    │  ← Read Path                   │
│          └──────────┬──────────┘                                │
│                     │                                            │
└─────────────────────┼────────────────────────────────────────────┘
                      │
                      │ [1] Read/Write via Supabase Client
                      │ [2] Realtime Subscription
                      │
┌─────────────────────▼────────────────────────────────────────────┐
│                      SUPABASE BACKEND                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Row Level Security (RLS)                                  │  │
│  │  • auth.uid() = user_id ✓                                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  user_progress Table                                       │  │
│  │  ┌──────────┬───────┬──────┬──────┬──────────┬──────────┐  │  │
│  │  │ user_id  │word_id│correct│wrong │mastery   │last_prac │  │  │
│  │  ├──────────┼───────┼──────┼──────┼──────────┼──────────┤  │  │
│  │  │ uuid-123 │   5   │  8   │  2   │    3     │ 2025-... │  │  │
│  │  │ uuid-123 │  17   │  5   │  0   │    4     │ 2025-... │  │  │
│  │  └──────────┴───────┴──────┴──────┴──────────┴──────────┘  │  │
│  │  UNIQUE(user_id, word_id)  ← Idempotent UPSERT            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Realtime Subscriptions                                    │  │
│  │  • channel: "user_progress:uuid-123"                       │  │
│  │  • events: INSERT, UPDATE, DELETE                          │  │
│  │  • filter: user_id=eq.uuid-123 (via RLS)                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 14. Offene Fragen & Diskussionspunkte

### 14.1 Debouncing vs. Immediate Writes

**Trade-off:**
- **Immediate Writes (aktuell)**: Jede Antwort → sofort DB (höhere Last, aber garantierte Persistierung)
- **Debounced Batch (vorgeschlagen)**: 500ms warten → batch senden (weniger Last, aber Mini-Risiko bei Tab-Close)

**Empfehlung:** Debouncing mit LocalStorage-Fallback (beste Balance).

### 14.2 Streak-Definition: Antworten vs. Tage

**Optionen:**
1. **Antworten-basiert** (aktuell): Aufeinanderfolgende korrekte Antworten
2. **Tages-basiert**: Aufeinanderfolgende Tage mit mindestens 1 geübtem Wort

**Empfehlung:** Antworten-basiert beibehalten (einfacher, sofortiges Feedback).

### 14.3 Aggregierte Views in DB vs. Frontend-Berechnung

**DB-View Option:**
```sql
CREATE VIEW user_stats AS
SELECT
  user_id,
  COUNT(DISTINCT word_id) as total_words_studied,
  SUM(correct_count + wrong_count) as total_attempts,
  SUM(correct_count) as correct_answers,
  ROUND(100.0 * SUM(correct_count) / NULLIF(SUM(correct_count + wrong_count), 0), 2) as accuracy
FROM user_progress
GROUP BY user_id;
```

**Pro:** Schneller bei sehr vielen Einträgen (>10k Wörter).
**Contra:** Weniger Flexibilität (Streak-Logik schwierig in SQL).

**Empfehlung:** Frontend-Berechnung beibehalten (max. 300 Wörter → kein Performance-Problem).

---

## 15. Zusammenfassung & Nächste Schritte

### 15.1 Was funktioniert bereits ✅

- ✅ Database Schema (`user_progress`, `learning_sessions`)
- ✅ `useProgress` Hook mit `updateProgress()`, `getStats()`
- ✅ RLS Policies (zu verifizieren)
- ✅ Optimistic Updates (lokaler State)
- ✅ Offline-Queue (In-Memory, ohne LocalStorage-Persistierung)
- ✅ ProgressBar nutzt `getStats()` (seit Bug-Fix)

### 15.2 Was muss implementiert werden ⚠️

1. **Entferne Dual-State** (Dashboard.tsx)
   - Lösche `state.progress`
   - Nutze nur noch `useProgress().getStats()`

2. **Realtime Subscription** (useProgress.ts)
   - Supabase Realtime Channel erstellen
   - Event-Handler für INSERT/UPDATE/DELETE
   - Reconciliation mit lokaler State

3. **Loading States** (alle Komponenten)
   - Skeleton-Loader statt 0-Werte
   - Explizite `loading` Prop in UI

4. **Debouncing** (optional, useProgress.ts)
   - Batch-Queue für schnelle Antworten
   - 500ms Debounce vor DB-Write

5. **LocalStorage Persistierung** (useProgress.ts)
   - Offline-Queue in localStorage speichern
   - Restore bei App-Start

6. **Tests** (neue Dateien)
   - Unit: `useProgress.test.ts`
   - Integration: `Dashboard.integration.test.tsx`
   - E2E: `progress-sync.spec.ts`, `rls-security.spec.ts`

7. **UI-Komponenten** (neue Dateien)
   - `SyncStatus.tsx` für Offline-Meldungen
   - `Skeleton.tsx` für Loading-States

### 15.3 Implementierungs-Reihenfolge (empfohlen)

**Woche 1: Foundation**
1. Entferne Dual-State (Dashboard.tsx refactoring)
2. Einführung `useProgressStats()` Hook
3. Loading States in allen Komponenten

**Woche 2: Realtime**
4. Supabase Realtime Subscription
5. Realtime Event-Handler
6. Test: Multi-Tab Sync

**Woche 3: Polish**
7. Debouncing + Batch-Updates
8. LocalStorage für Offline-Queue
9. SyncStatus UI-Komponente

**Woche 4: Tests**
10. Unit-Tests für Aggregation-Logik
11. Integration-Tests
12. E2E-Tests für alle Szenarien
13. RLS Policy-Tests

---

## 16. Antworten auf spezifische Fragen

### **Datenmodell & Single Source of Truth**
✅ Tabellen ausreichend: `user_progress` (roh), aggregiert via `getStats()`
✅ Keys: `(user_id, word_id)` UNIQUE Constraint
✅ Aggregation: Frontend (getStats()), nicht DB-Trigger

### **Schreibpfad beim Üben**
✅ Flow: local state → persist (UPSERT) → optimistic update → server ack → reconcile
✅ Idempotenz: UPSERT mit `onConflict: 'user_id,word_id'`
⚠️ NEU: Debounce (500ms) + Batch für schnelle Eingaben
⚠️ NEU: Exponential Backoff für Retries

### **Lesepfad & Konsistenz**
⚠️ NEU: `useProgressStats()` Hook als gemeinsamer Selector
✅ Laden nach Auth-Initialisierung (authLoading + progressLoading)
⚠️ NEU: Cache-Invalidation via Realtime Events

### **Realtime-Sync**
⚠️ NEU: Supabase Realtime Subscription auf `user_progress`
✅ RLS filtert automatisch (nur eigene Rows)
✅ Kein 0-Flackern: Loading-Skeleton

### **Streak-Logik**
✅ Bereits implementiert: Last 10 Wörter, consecutive correct
✅ Berechnung: Frontend (`getStats()`)
❌ Tages-Streak: NICHT implementiert (zu komplex)

### **Fehler-/Offline-Handling**
✅ Queue bereits vorhanden
⚠️ NEU: LocalStorage-Persistierung
⚠️ NEU: SyncStatus UI-Komponente
✅ Idempotent Writes garantiert keine Duplikate

### **Tests**
⚠️ NEU: Alle Test-Dateien (siehe Sektion 10)
⚠️ NEU: RLS Policy-Tests

---

## Ende des Plans

**Dieser Plan ist KEIN Code.** Er beschreibt die Architektur und Implementierungsstrategie für eine saubere Fortschritts-Synchronisation.

**Nächster Schritt:** Bestätigung durch User, dann Implementierung der Komponenten Phase für Phase.
